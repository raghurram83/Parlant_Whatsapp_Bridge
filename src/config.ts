import { z } from "zod";

const webhookVerifySchema = z.object({
  enabled: z.boolean().default(false),
  headerName: z.string().min(1).default("X-Hub-Signature-256"),
  secret: z.string().default("")
});

export const configSchema = z.object({
  parlant: z.object({
    baseUrl: z.string().url(),
    agentId: z.string().default(""),
    apiKey: z.string().nullable().default(null)
  }),
  session: z.object({
    ttlHours: z.number().int().positive().max(168).default(24)
  }),
  webhook: z.object({
    allowedPhoneNumberIds: z.array(z.string()).default([]),
    allowedDisplayNumbers: z.array(z.string()).default([]),
    verify: webhookVerifySchema
  }),
  myoperator: z.object({
    sendApi: z.object({
      url: z.string().url(),
      apiKey: z.string().default(""),
      companyId: z.string().default(""),
      defaultMyopPhoneNumberId: z.string().default(""),
      defaultCountryCode: z.string().default(""),
      previewUrl: z.boolean().default(false),
      customerNumberFormat: z.enum(["E164", "NATIONAL"]).default("E164")
    })
  })
});

export type BridgeConfig = z.infer<typeof configSchema>;

export const defaultConfig: BridgeConfig = {
  parlant: {
    baseUrl: "http://localhost:8800",
    agentId: "",
    apiKey: null
  },
  session: {
    ttlHours: 24
  },
  webhook: {
    allowedPhoneNumberIds: [],
    allowedDisplayNumbers: [],
    verify: {
      enabled: false,
      headerName: "X-Hub-Signature-256",
      secret: ""
    }
  },
  myoperator: {
    sendApi: {
      url: "https://publicapi.myoperator.co/chat/messages",
      apiKey: "",
      companyId: "",
      defaultMyopPhoneNumberId: "",
      defaultCountryCode: "91",
      previewUrl: false,
      customerNumberFormat: "E164"
    }
  }
};

export function mergeConfig(base: BridgeConfig, update: Partial<BridgeConfig>) {
  const merged = deepMerge(base, update);
  return configSchema.parse(merged);
}

function deepMerge<T>(base: T, update: Partial<T>): T {
  if (!isPlainObject(base) || !isPlainObject(update)) {
    return (update ?? base) as T;
  }
  const next: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(update)) {
    if (value === undefined) {
      continue;
    }
    const baseValue = (base as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      next[key] = value;
      continue;
    }
    if (isPlainObject(value) && isPlainObject(baseValue)) {
      next[key] = deepMerge(baseValue, value as Record<string, unknown>);
      continue;
    }
    next[key] = value;
  }
  return next as T;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
