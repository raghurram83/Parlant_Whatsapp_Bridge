export type BridgeConfig = {
  parlant: {
    baseUrl: string;
    agentId: string;
    apiKey: string | null;
  };
  session: {
    ttlHours: number;
  };
  webhook: {
    allowedPhoneNumberIds: string[];
    allowedDisplayNumbers: string[];
    verify: {
      enabled: boolean;
      headerName: string;
      secret: string;
    };
  };
  myoperator: {
    sendApi: {
      url: string;
      apiKey: string;
      companyId: string;
      defaultMyopPhoneNumberId: string;
      defaultCountryCode: string;
      previewUrl: boolean;
      customerNumberFormat: "E164" | "NATIONAL";
    };
  };
};

export type BridgeStatus = {
  lastWebhookAt: number | null;
  lastSendStatus: {
    ok: boolean;
    message: string;
    at: number;
  } | null;
};

const API_BASE =
  process.env.NEXT_PUBLIC_BRIDGE_BASE_URL ?? "http://localhost:8083";

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  return (await response.json()) as T;
}

export const bridgeApi = {
  getConfig() {
    return request<BridgeConfig>("/config");
  },
  updateConfig(config: BridgeConfig) {
    return request<BridgeConfig>("/config", {
      method: "PUT",
      body: JSON.stringify(config)
    });
  },
  testParlant(text?: string) {
    return request<{ ok: boolean; sessionId?: string; responseText?: string }>(
      "/test/parlant",
      {
        method: "POST",
        body: JSON.stringify({ text })
      }
    );
  },
  testSend(payload: { toNumber: string; text?: string; countryCode?: string }) {
    return request<{ ok: boolean }>("/test/send", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  resetSession(payload: { customerNumber: string; countryCode?: string }) {
    return request<{ ok: boolean; removed: number }>("/sessions/reset", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  getStatus() {
    return request<BridgeStatus>("/status");
  }
};
