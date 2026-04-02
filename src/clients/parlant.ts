import axios, { AxiosInstance } from "axios";
import type { Logger } from "pino";

export type ParlantClientConfig = {
  baseUrl: string;
  agentId: string;
  apiKey: string | null;
};

export interface ParlantClient {
  createSession(externalUserId: string, metadata?: Record<string, unknown>): Promise<string>;
  sendMessage(sessionId: string, text: string): Promise<string>;
}

export function createParlantClient(config: ParlantClientConfig, logger: Logger): ParlantClient {
  const httpClient = new HttpParlantClient(config, logger);
  const fallback = new MockParlantClient();
  return new ResilientParlantClient(httpClient, fallback, logger);
}

class ResilientParlantClient implements ParlantClient {
  constructor(
    private readonly primary: ParlantClient,
    private readonly fallback: ParlantClient,
    private readonly logger: Logger
  ) {}

  async createSession(externalUserId: string, metadata?: Record<string, unknown>) {
    try {
      return await this.primary.createSession(externalUserId, metadata);
    } catch (error) {
      this.logger.warn({ err: error }, "Parlant createSession failed; using fallback");
      return this.fallback.createSession(externalUserId, metadata);
    }
  }

  async sendMessage(sessionId: string, text: string) {
    try {
      return await this.primary.sendMessage(sessionId, text);
    } catch (error) {
      this.logger.warn({ err: error }, "Parlant sendMessage failed; using fallback");
      return this.fallback.sendMessage(sessionId, text);
    }
  }
}

class HttpParlantClient implements ParlantClient {
  private readonly http: AxiosInstance;

  constructor(private readonly config: ParlantClientConfig, private readonly logger: Logger) {
    this.http = axios.create({
      baseURL: config.baseUrl,
      timeout: 120000,
      headers: buildAuthHeaders(config)
    });
  }

  async createSession(externalUserId: string, metadata?: Record<string, unknown>) {
    const payload = buildCreateSessionPayload(this.config, externalUserId, metadata);
    const response = await this.http.post("/sessions", payload);
    const sessionId = extractSessionId(response.data);
    if (!sessionId) {
      throw new Error("Unable to resolve Parlant session id from response.");
    }
    return sessionId;
  }

  async sendMessage(sessionId: string, text: string) {
    const eventPayload = buildEventPayload(text);
    const eventResponse = await this.http.post(`/sessions/${sessionId}/events`, eventPayload);
    let minOffset = resolveNextOffset(eventResponse.data);
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) {
      const remaining = Math.max(1, Math.ceil((deadline - Date.now()) / 1000));
      try {
        const eventsResponse = await this.http.get(`/sessions/${sessionId}/events`, {
          params: {
            min_offset: minOffset,
            source: "ai_agent",
            wait_for_data: Math.min(30, remaining)
          }
        });
        const reply = extractAssistantText(eventsResponse.data);
        if (reply) {
          return reply;
        }
        const nextOffset = resolveNextOffsetFromEvents(eventsResponse.data);
        if (nextOffset !== null) {
          minOffset = nextOffset;
        }
      } catch (error) {
        if (isGatewayTimeout(error)) {
          continue;
        }
        throw error;
      }
    }
    throw new Error("Unable to parse assistant text from Parlant events.");
  }
}

class MockParlantClient implements ParlantClient {
  async createSession() {
    return `mock-${Date.now()}`;
  }

  async sendMessage() {
    return "I ran into a configuration issue while reaching Parlant. Please try again shortly.";
  }
}

function buildAuthHeaders(config: ParlantClientConfig) {
  if (!config.apiKey) {
    return undefined;
  }
  return {
    Authorization: `Bearer ${config.apiKey}`
  };
}

function buildCreateSessionPayload(
  config: ParlantClientConfig,
  externalUserId: string,
  metadata?: Record<string, unknown>
) {
  return {
    agent_id: config.agentId,
    metadata: {
      external_user_id: externalUserId,
      ...(metadata ?? {})
    }
  };
}

function buildEventPayload(text: string) {
  return {
    kind: "message",
    source: "customer",
    message: text
  };
}

function extractSessionId(data: unknown) {
  if (!data || typeof data !== "object") {
    return null;
  }
  const record = data as Record<string, unknown>;
  return (
    record.id ||
    record.session_id ||
    (record.session && typeof record.session === "object"
      ? (record.session as Record<string, unknown>).id
      : null)
  ) as string | null;
}

function extractAssistantText(data: unknown) {
  const events = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? (data as Record<string, unknown>).items ?? data
      : [];

  if (!Array.isArray(events)) {
    return null;
  }

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (!event || typeof event !== "object") {
      continue;
    }
    const record = event as Record<string, unknown>;
    if (record.source !== "ai_agent") {
      continue;
    }
    if (record.kind !== "message") {
      continue;
    }
    const dataField = record.data;
    const extracted = extractMessageText(dataField);
    if (extracted) {
      return extracted;
    }
  }
  return null;
}

function resolveNextOffset(eventResponse: unknown) {
  if (eventResponse && typeof eventResponse === "object") {
    const record = eventResponse as Record<string, unknown>;
    const offset = record.offset;
    if (typeof offset === "number" && Number.isFinite(offset)) {
      return offset + 1;
    }
  }
  return 0;
}

function resolveNextOffsetFromEvents(events: unknown) {
  const list = Array.isArray(events)
    ? events
    : events && typeof events === "object"
      ? (events as Record<string, unknown>).items
      : null;
  if (!Array.isArray(list) || list.length === 0) {
    return null;
  }
  const last = list[list.length - 1];
  if (!last || typeof last !== "object") {
    return null;
  }
  const offset = (last as Record<string, unknown>).offset;
  if (typeof offset === "number" && Number.isFinite(offset)) {
    return offset + 1;
  }
  return null;
}

function isGatewayTimeout(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }
  const record = error as { response?: { status?: number } } & { code?: string };
  return (
    record.response?.status === 504 ||
    record.code === "ERR_BAD_RESPONSE" ||
    record.code === "ECONNABORTED"
  );
}
function extractMessageText(value: unknown): string | null {
  if (!value) {
    return null;
  }
  if (typeof value === "string") {
    return value.trim() ? value : null;
  }
  if (typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  const direct =
    record.message ??
    record.text ??
    record.content ??
    (record.context && typeof record.context === "object"
      ? (record.context as Record<string, unknown>).body
      : null);
  if (typeof direct === "string" && direct.trim()) {
    return direct;
  }
  return null;
}
