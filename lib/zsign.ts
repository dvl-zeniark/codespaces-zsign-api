import { Agent, fetch as undiciFetch } from "undici";
import { getConfig } from "@/lib/config";

/**
 * Node's global fetch (undici) pools keep-alive connections and can try to
 * reuse one the server already silently closed, surfacing as
 * "SocketError: other side closed" - a known undici race (nodejs/undici#3492,
 * #3300, #2412), more likely to show up over StackBlitz WebContainer's
 * network path. A short keepAliveTimeout makes the client discard pooled
 * connections well before the server would, avoiding the race.
 */
const dispatcher = new Agent({
  keepAliveTimeout: 1000,
  keepAliveMaxTimeout: 1000,
});

export class ZsignError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`ZSign HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

// Circuit breaker: once a real network-level failure happens, stop attempting
// fetch() entirely for a cooldown window instead of letting every fresh page
// load / hot-reload / SSE-triggered refetch hit a known-broken connection.
const BREAKER_COOLDOWN_MS = 15000;

declare global {
  var __zsignBreakerBrokenAt: number | undefined;
}

function breakerOpen(): number {
  const brokenAt = globalThis.__zsignBreakerBrokenAt || 0;
  const remaining = BREAKER_COOLDOWN_MS - (Date.now() - brokenAt);
  return remaining > 0 ? remaining : 0;
}

function breakerTrip() {
  globalThis.__zsignBreakerBrokenAt = Date.now();
}

function breakerReset() {
  globalThis.__zsignBreakerBrokenAt = 0;
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/** Server-only ZSign External API. Key never goes to the browser. */
export async function zsign(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const { apiKey, apiBase } = getConfig();
  if (!apiKey) {
    throw new ZsignError(401, {
      message: "Set ZSIGN_API_KEY in .env (your org key from ZSign Integrations)",
    });
  }
  const url = `${apiBase}/api/v1/external/${path.replace(/^\/+/, "")}`;
  const method = init.method || "GET";

  const cooldown = breakerOpen();
  if (cooldown > 0) {
    console.warn(
      `[zsign] skipping ${method} ${url} - breaker open, ${Math.ceil(cooldown / 1000)}s left`,
    );
    throw new Error(
      `ZSign API was unreachable ${Math.ceil((BREAKER_COOLDOWN_MS - cooldown) / 1000)}s ago; not retrying for ${Math.ceil(cooldown / 1000)}s`,
    );
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey}`);
  if (!headers.has("Idempotency-Key") && init.method && init.method !== "GET") {
    headers.set("Idempotency-Key", crypto.randomUUID());
  }

  console.log(`[zsign] -> ${method} ${url}`);
  try {
    const res = (await undiciFetch(url, {
      ...init,
      headers,
      dispatcher,
    } as Parameters<typeof undiciFetch>[1])) as unknown as Response;
    console.log(`[zsign] <- ${res.status} ${method} ${url}`);
    breakerReset();
    return res;
  } catch (err) {
    console.error(`[zsign] fetch failed: ${method} ${url}`, describeFetchError(err));
    breakerTrip();
    throw err;
  }
}

/** Node's `TypeError: fetch failed` hides the real reason in `.cause` - surface it. */
function describeFetchError(err: unknown): string {
  if (err instanceof Error) {
    const cause = (err as Error & { cause?: unknown }).cause;
    return cause ? `${err.message}: ${String(cause)}` : err.message;
  }
  return String(err);
}

export async function zsignJson<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await zsign(path, init);
  const body = await parseBody(res);
  if (!res.ok) throw new ZsignError(res.status, body);
  return body as T;
}

export async function zsignPdf(path: string): Promise<Blob> {
  const res = await zsign(path);
  if (!res.ok) throw new ZsignError(res.status, await parseBody(res));
  return res.blob();
}

export async function uploadDocument(bytes: Uint8Array | Buffer, filename: string) {
  const form = new FormData();
  form.append(
    "file",
    new Blob([Buffer.from(bytes)], { type: "application/pdf" }),
    filename,
  );
  return zsignJson<{ id: string }>("documents", { method: "POST", body: form });
}
