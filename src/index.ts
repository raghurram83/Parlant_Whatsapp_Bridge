import Fastify, { FastifyInstance, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import path from "path";
import {
  BridgeConfig,
  configSchema,
  defaultConfig,
  mergeConfig
} from "./config";
import {
  createDb,
  getConfig,
  getSession,
  getStatus,
  insertAudit,
  isDuplicate,
  markProcessed,
  deleteSessionMapping,
  setConfig,
  setStatus,
  upsertSession
} from "./db";
import { createParlantClient } from "./clients/parlant";
import { createMyOperatorClient } from "./clients/myoperator";
import { extractMessages, isAllowedInbound } from "./routes/whatsapp";
import { verifySignature } from "./utils/hmac";
import {
  formatCustomerNumber,
  normalizeInboundNumber,
  resolveCountryCode
} from "./utils/numbers";

const PORT = Number(process.env.BRIDGE_PORT ?? "8083");
const HOST = process.env.BRIDGE_HOST ?? "0.0.0.0";
const DB_PATH = process.env.BRIDGE_DB_PATH ?? path.join(process.cwd(), "data", "bridge.db");

const app = Fastify({
  logger: {
    level: "info",
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers['x-myop-company-id']",
        "config.parlant.apiKey",
        "config.myoperator.sendApi.apiKey",
        "config.webhook.verify.secret"
      ],
      remove: true
    }
  }
});

app.addContentTypeParser(
  "application/json",
  { parseAs: "buffer" },
  (req, body, done) => {
    (req as FastifyRequest & { rawBody?: Buffer }).rawBody = body as Buffer;
    try {
      done(null, JSON.parse((body as Buffer).toString("utf8")));
    } catch (error) {
      done(error as Error, undefined);
    }
  }
);

app.register(cors, { origin: true, methods: ["GET", "POST", "PUT"] });
app.register(rateLimit, { global: false });

const db = createDb(DB_PATH);
let currentConfig = loadConfig(db);
let parlantClient = createParlantClient(currentConfig.parlant, app.log);
let myOperatorClient = createMyOperatorClient(currentConfig.myoperator.sendApi, app.log);

function refreshClients(nextConfig: BridgeConfig) {
  parlantClient = createParlantClient(nextConfig.parlant, app.log);
  myOperatorClient = createMyOperatorClient(nextConfig.myoperator.sendApi, app.log);
}

app.get("/health", async () => ({ ok: true }));

app.get("/config", async () => currentConfig);

app.put("/config", async (request, reply) => {
  try {
    const payload = request.body as Partial<BridgeConfig>;
    const nextConfig = mergeConfig(currentConfig, payload ?? {});
    setConfig(db, nextConfig);
    currentConfig = nextConfig;
    refreshClients(nextConfig);
    return reply.send(nextConfig);
  } catch (error) {
    request.log.warn({ err: error }, "Config validation failed");
    return reply.code(400).send({ error: "Invalid config payload." });
  }
});

app.get("/status", async () => getStatus(db));

app.post("/sessions/reset", async (request, reply) => {
  const body = request.body as { customerNumber?: string; countryCode?: string };
  if (!body?.customerNumber) {
    return reply.code(400).send({ ok: false, error: "Missing customerNumber" });
  }
  const normalized = normalizeInboundNumber(
    body.customerNumber,
    body.countryCode || currentConfig.myoperator.sendApi.defaultCountryCode
  );
  if (!normalized) {
    return reply.code(400).send({ ok: false, error: "Invalid customerNumber" });
  }
  const externalUserId = `${currentConfig.myoperator.sendApi.companyId}:whatsapp:${normalized}`;
  const removed = deleteSessionMapping(db, externalUserId);
  return reply.send({ ok: true, removed });
});

app.post("/test/parlant", async (request, reply) => {
  const body = request.body as { text?: string };
  if (!currentConfig.parlant.agentId) {
    return reply.code(400).send({ ok: false, error: "Missing parlant.agentId" });
  }
  const text = body?.text?.trim() || "Ping from WhatsApp Bridge";
  const sessionId = await parlantClient.createSession(`test-${Date.now()}`, {
    channel: "test"
  });
  const responseText = await parlantClient.sendMessage(sessionId, text);
  return reply.send({ ok: true, sessionId, responseText });
});

app.post("/test/send", async (request, reply) => {
  const body = request.body as { toNumber?: string; text?: string; countryCode?: string };
  if (!body?.toNumber) {
    return reply.code(400).send({ ok: false, error: "Missing toNumber" });
  }
  const text = body.text?.trim() || "Test message from WhatsApp Bridge";
  const countryCode = body.countryCode || currentConfig.myoperator.sendApi.defaultCountryCode;
  const customerNumber = formatCustomerNumber(
    body.toNumber,
    countryCode,
    currentConfig.myoperator.sendApi.customerNumberFormat
  );
  await myOperatorClient.sendText({
    customerNumber,
    customerCountryCode: countryCode,
    text
  });
  return reply.send({ ok: true });
});

app.post(
  "/webhook/whatsapp",
  {
    config: {
      rateLimit: {
        max: 60,
        timeWindow: "1 minute"
      }
    }
  },
  async (request, reply) => {
    const rawBody = (request as FastifyRequest & { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      return reply.code(400).send({ error: "Missing raw body" });
    }

    if (currentConfig.webhook.verify.enabled) {
      const headerName = currentConfig.webhook.verify.headerName;
      const signature = request.headers[headerName.toLowerCase()] as
        | string
        | undefined;
      const valid = verifySignature(rawBody, signature, currentConfig.webhook.verify.secret);
      if (!valid) {
        return reply.code(401).send({ error: "Invalid signature" });
      }
    }

    const messages = extractMessages(request.body);
    if (messages.length === 0) {
      return reply.send({ ignored: true, processed: 0 });
    }

    const summary = {
      processed: 0,
      ignored: 0,
      duplicates: 0,
      errors: 0
    };

    const status = getStatus(db);
    setStatus(db, { ...status, lastWebhookAt: Date.now() });

    for (const message of messages) {
      const childLogger = request.log.child({ correlation_id: message.messageId });
      if (
        !isAllowedInbound(
          message.metadata,
          currentConfig.webhook.allowedPhoneNumberIds,
          currentConfig.webhook.allowedDisplayNumbers
        )
      ) {
        summary.ignored += 1;
        continue;
      }
      if (isDuplicate(db, message.messageId)) {
        summary.duplicates += 1;
        continue;
      }
      markProcessed(db, message.messageId);

      try {
        const externalUserId = `${currentConfig.myoperator.sendApi.companyId}:whatsapp:${message.sender}`;
        const session = getSession(db, externalUserId);
        const now = Date.now();
        const ttlMs = currentConfig.session.ttlHours * 60 * 60 * 1000;
        let sessionId = session?.parlant_session_id;
        if (!session || now - session.last_seen_at > ttlMs || !sessionId) {
          sessionId = await parlantClient.createSession(externalUserId, {
            channel: "whatsapp",
            sender: message.sender
          });
        }

        const replyText = await parlantClient.sendMessage(sessionId, message.text);

        const countryCode = resolveCountryCode(
          message.sender,
          currentConfig.myoperator.sendApi.defaultCountryCode
        );
        const customerNumber = formatCustomerNumber(
          message.sender,
          countryCode,
          currentConfig.myoperator.sendApi.customerNumberFormat
        );

        await myOperatorClient.sendText({
          customerNumber,
          customerCountryCode: countryCode,
          text: replyText
        });

        upsertSession(db, externalUserId, sessionId, now);
        insertAudit(db, {
          messageId: message.messageId,
          sender: message.sender,
          inboundText: message.text,
          outboundText: replyText,
          metaPhoneNumberId: message.metadata.phone_number_id ?? "",
          status: "sent"
        });

        setStatus(db, {
          ...getStatus(db),
          lastSendStatus: { ok: true, message: "sent", at: now }
        });

        summary.processed += 1;
      } catch (error) {
        summary.errors += 1;
        childLogger.error({ err: error }, "Failed to process inbound message");
        insertAudit(db, {
          messageId: message.messageId,
          sender: message.sender,
          inboundText: message.text,
          outboundText: "",
          metaPhoneNumberId: message.metadata.phone_number_id ?? "",
          status: "failed"
        });
        setStatus(db, {
          ...getStatus(db),
          lastSendStatus: {
            ok: false,
            message: "failed",
            at: Date.now()
          }
        });
      }
    }

    return reply.send(summary);
  }
);

function loadConfig(database: ReturnType<typeof createDb>): BridgeConfig {
  const existing = getConfig(database);
  if (existing) {
    return configSchema.parse(existing);
  }
  setConfig(database, defaultConfig);
  return defaultConfig;
}

async function startServer(server: FastifyInstance) {
  try {
    await server.listen({ port: PORT, host: HOST });
    server.log.info(`Parlant bridge listening on ${HOST}:${PORT}`);
  } catch (error) {
    server.log.error({ err: error }, "Failed to start server");
    process.exit(1);
  }
}

startServer(app);
