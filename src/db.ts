import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import type { BridgeConfig } from "./config";

export type BridgeDb = ReturnType<typeof createDb>;

type StatusState = {
  lastWebhookAt: number | null;
  lastSendStatus: {
    ok: boolean;
    message: string;
    at: number;
  } | null;
};

export function createDb(dbPath: string) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      external_user_id TEXT PRIMARY KEY,
      parlant_session_id TEXT NOT NULL,
      last_seen_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS idempotency (
      message_id TEXT PRIMARY KEY,
      processed_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT,
      sender TEXT,
      inbound_text TEXT,
      outbound_text TEXT,
      meta_phone_number_id TEXT,
      status TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS status (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL
    );
  `);
  return db;
}

export function getConfig(db: BridgeDb): BridgeConfig | null {
  const row = db.prepare("SELECT data FROM config WHERE id = 1").get() as
    | { data: string }
    | undefined;
  return row ? (JSON.parse(row.data) as BridgeConfig) : null;
}

export function setConfig(db: BridgeDb, config: BridgeConfig) {
  const stmt = db.prepare(
    "INSERT INTO config (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data"
  );
  stmt.run(JSON.stringify(config));
}

export function getSession(db: BridgeDb, externalUserId: string) {
  return db
    .prepare(
      "SELECT external_user_id, parlant_session_id, last_seen_at FROM sessions WHERE external_user_id = ?"
    )
    .get(externalUserId) as
    | {
        external_user_id: string;
        parlant_session_id: string;
        last_seen_at: number;
      }
    | undefined;
}

export function upsertSession(
  db: BridgeDb,
  externalUserId: string,
  parlantSessionId: string,
  lastSeenAt: number
) {
  db.prepare(
    "INSERT INTO sessions (external_user_id, parlant_session_id, last_seen_at) VALUES (?, ?, ?) ON CONFLICT(external_user_id) DO UPDATE SET parlant_session_id = excluded.parlant_session_id, last_seen_at = excluded.last_seen_at"
  ).run(externalUserId, parlantSessionId, lastSeenAt);
}

export function deleteSessionMapping(db: BridgeDb, externalUserId: string) {
  const result = db
    .prepare("DELETE FROM sessions WHERE external_user_id = ?")
    .run(externalUserId);
  return result.changes;
}

export function isDuplicate(db: BridgeDb, messageId: string) {
  const row = db
    .prepare("SELECT message_id FROM idempotency WHERE message_id = ?")
    .get(messageId) as { message_id: string } | undefined;
  return Boolean(row);
}

export function markProcessed(db: BridgeDb, messageId: string) {
  db.prepare(
    "INSERT OR IGNORE INTO idempotency (message_id, processed_at) VALUES (?, ?)"
  ).run(messageId, Date.now());
}

export function insertAudit(
  db: BridgeDb,
  record: {
    messageId: string;
    sender: string;
    inboundText: string;
    outboundText: string;
    metaPhoneNumberId: string;
    status: string;
  }
) {
  db.prepare(
    "INSERT INTO audit (message_id, sender, inbound_text, outbound_text, meta_phone_number_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(
    record.messageId,
    record.sender,
    record.inboundText,
    record.outboundText,
    record.metaPhoneNumberId,
    record.status,
    Date.now()
  );
}

export function getStatus(db: BridgeDb): StatusState {
  const row = db.prepare("SELECT data FROM status WHERE id = 1").get() as
    | { data: string }
    | undefined;
  if (!row) {
    return { lastWebhookAt: null, lastSendStatus: null };
  }
  return JSON.parse(row.data) as StatusState;
}

export function setStatus(db: BridgeDb, status: StatusState) {
  db.prepare(
    "INSERT INTO status (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data"
  ).run(JSON.stringify(status));
}
