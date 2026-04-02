export type MetaMessage = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
};

export type MetaMetadata = {
  phone_number_id?: string;
  display_phone_number?: string;
};

export type ExtractedMessage = {
  messageId: string;
  sender: string;
  text: string;
  metadata: MetaMetadata;
};

export function extractMessages(payload: unknown): ExtractedMessage[] {
  const myOperatorMessage = extractMyOperatorMessage(payload);
  if (myOperatorMessage) {
    return [myOperatorMessage];
  }
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const root = payload as Record<string, unknown>;
  const entries = Array.isArray(root.entry) ? root.entry : [];
  const extracted: ExtractedMessage[] = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const changes = Array.isArray((entry as Record<string, unknown>).changes)
      ? ((entry as Record<string, unknown>).changes as unknown[])
      : [];
    for (const change of changes) {
      if (!change || typeof change !== "object") {
        continue;
      }
      const changeRecord = change as Record<string, unknown>;
      if (changeRecord.field !== "messages") {
        continue;
      }
      const value = changeRecord.value as Record<string, unknown> | undefined;
      const metadata = (value?.metadata as MetaMetadata) ?? {};
      const messages = Array.isArray(value?.messages) ? value?.messages : [];
      for (const message of messages) {
        if (!message || typeof message !== "object") {
          continue;
        }
        const record = message as MetaMessage;
        if (record.type !== "text") {
          continue;
        }
        const text = record.text?.body;
        if (!record.id || !record.from || !text) {
          continue;
        }
        extracted.push({
          messageId: record.id,
          sender: record.from,
          text,
          metadata
        });
      }
    }
  }

  return extracted;
}

export function isAllowedInbound(
  metadata: MetaMetadata,
  allowedIds: string[],
  _allowedDisplayNumbers: string[]
) {
  const { phone_number_id, display_phone_number } = metadata;
  if (allowedIds.length > 0 && (!phone_number_id || !allowedIds.includes(phone_number_id))) {
    return false;
  }
  void display_phone_number;
  return true;
}

type MyOperatorPayload = {
  type?: string;
  event?: string;
  data?: {
    id?: string;
    action?: string;
    data?: {
      type?: string;
      context?: { body?: string };
    };
    metadata?: { waba_msg_id?: string | null };
    phone_number_id?: string;
    conversation?: {
      customer_country_code?: string;
      customer_contact?: string;
    };
  };
};

function extractMyOperatorMessage(payload: unknown): ExtractedMessage | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const record = payload as MyOperatorPayload;
  if (record.type !== "message" || record.event !== "received") {
    return null;
  }
  const data = record.data;
  if (!data || data.action !== "incoming") {
    return null;
  }
  const text = data.data?.context?.body;
  if (!text) {
    return null;
  }
  const messageId = data.metadata?.waba_msg_id || data.id;
  if (!messageId) {
    return null;
  }
  const contact = data.conversation?.customer_contact;
  if (!contact) {
    return null;
  }
  const countryCode = data.conversation?.customer_country_code || "";
  const sender = normalizeSender(contact, countryCode);
  return {
    messageId,
    sender,
    text,
    metadata: {
      phone_number_id: data.phone_number_id
    }
  };
}

function normalizeSender(contact: string, countryCode: string) {
  const trimmed = contact.trim();
  if (!countryCode) {
    return trimmed;
  }
  if (trimmed.startsWith(countryCode)) {
    return trimmed;
  }
  return `${countryCode}${trimmed}`;
}
