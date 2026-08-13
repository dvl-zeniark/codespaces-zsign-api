import { getIO } from "@/lib/socket-server";

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
  return (process.env.ZSIGN_WEBHOOK_SECRET || "").trim();
}

export function recordWebhook(type: string): InboxEvent {
  const row: InboxEvent = {
    type: type || "unknown",
    at: new Date().toISOString(),
  };
  const events = store();
  events.unshift(row);
  events.splice(MAX);
  getIO()?.emit("webhook", row);
  return row;
}

export function listWebhooks(): InboxEvent[] {
  return store();
}
