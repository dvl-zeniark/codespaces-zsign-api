import { emitUpdate } from "@/lib/events";
import { readEnvLocal } from "@/lib/config";

export type InboxEvent = {
  type: string;
  at: string;
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

export function recordWebhook(type: string): InboxEvent {
  const row: InboxEvent = {
    type: type || "unknown",
    at: new Date().toISOString(),
  };
  const events = store();
  events.unshift(row);
  events.splice(MAX);
  emitUpdate(row.type);
  return row;
}

export function listWebhooks(): InboxEvent[] {
  return store();
}
