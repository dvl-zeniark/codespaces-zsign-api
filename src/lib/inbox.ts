import { randomUUID } from "node:crypto";
import { readEnvLocal } from "@/lib/config";

export type InboxEvent = {
  id: string;
  type: string;
  receivedAt: string;
  payloadSummary: string;
};

const MAX = 20;

declare global {
  var __zsignInbox: InboxEvent[] | undefined;
}

function store(): InboxEvent[] {
  if (!globalThis.__zsignInbox) {
    globalThis.__zsignInbox = [];
  }
  return globalThis.__zsignInbox;
}

export function getWebhookSecret(): string {
  const fileEnv = readEnvLocal();
  return (fileEnv.ZSIGN_WEBHOOK_SECRET || import.meta.env.ZSIGN_WEBHOOK_SECRET || "").trim();
}

function summarizePayload(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "";
  }
  const record = body as Record<string, unknown>;
  const data = record.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.signatureRequestId === "string") {
      return `signatureRequestId=${d.signatureRequestId}`;
    }
    if (typeof d.documentId === "string") {
      return `documentId=${d.documentId}`;
    }
  }
  try {
    const text = JSON.stringify(body);
    return text.length > 120 ? `${text.slice(0, 117)}...` : text;
  } catch {
    return "";
  }
}

export function recordWebhook(type: string, rawBody: string): InboxEvent {
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch {
    /* keep empty summary */
  }

  const envelopeId =
    parsed &&
    typeof parsed === "object" &&
    typeof (parsed as Record<string, unknown>).id === "string"
      ? (parsed as Record<string, unknown>).id
      : null;

  const row: InboxEvent = {
    id: String(envelopeId ?? randomUUID()),
    type: type || "unknown",
    receivedAt: new Date().toISOString(),
    payloadSummary: summarizePayload(parsed),
  };
  const events = store();
  events.unshift(row);
  events.splice(MAX);
  return row;
}

export function listWebhooks(): InboxEvent[] {
  return [...store()];
}
