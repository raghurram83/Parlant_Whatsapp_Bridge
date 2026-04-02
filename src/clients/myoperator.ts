import axios, { AxiosError } from "axios";
import type { Logger } from "pino";
import { sleep } from "../utils/sleep";

export type MyOperatorConfig = {
  url: string;
  apiKey: string;
  companyId: string;
  defaultMyopPhoneNumberId: string;
  defaultCountryCode: string;
  previewUrl: boolean;
  customerNumberFormat: "E164" | "NATIONAL";
};

export type SendTextPayload = {
  phoneNumberId?: string;
  customerNumber: string;
  customerCountryCode: string;
  text: string;
  previewUrl?: boolean;
};

export function createMyOperatorClient(config: MyOperatorConfig, logger: Logger) {
  const apiKey = normalizeApiKey(config.apiKey);
  const http = axios.create({
    baseURL: config.url,
    timeout: 15000,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-MYOP-COMPANY-ID": config.companyId,
      "Content-Type": "application/json"
    }
  });

  async function sendText(payload: SendTextPayload) {
    const body = {
      phone_number_id: payload.phoneNumberId ?? config.defaultMyopPhoneNumberId,
      customer_country_code: payload.customerCountryCode,
      customer_number: payload.customerNumber,
      data: {
        type: "text",
        context: {
          body: payload.text,
          preview_url: payload.previewUrl ?? config.previewUrl
        }
      },
      reply_to: null,
      myop_ref_id: null
    };

    const backoffs = [300, 900, 2000];
    for (let attempt = 0; attempt < backoffs.length; attempt += 1) {
      try {
        await http.post("", body);
        return { ok: true, message: "sent" };
      } catch (error) {
        const err = error as AxiosError;
        const status = err.response?.status ?? 0;
        const shouldRetry = status >= 500 || status === 0;
        if (!shouldRetry || attempt === backoffs.length - 1) {
          logger.error({ err, status }, "MyOperator send failed");
          throw error;
        }
        await sleep(backoffs[attempt]);
      }
    }
    return { ok: false, message: "unreachable" };
  }

  return {
    sendText
  };
}

function normalizeApiKey(apiKey: string) {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return trimmed;
  }
  return trimmed.replace(/^(Bearer\s+)+/i, "");
}
