import { Agent, fetch as undiciFetch } from "undici";
import { getConfig } from "./config";

export class ZsignError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`ZSign HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
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

/**
 * StackBlitz WebContainer's outbound network proxy can silently tear down a
 * pooled keep-alive connection between requests; undici still tries to
 * reuse it and throws "SocketError: other side closed" (nodejs/undici#3492,
 * #3300, #2412). Retrying the plain fetch() again reuses the same pooled
 * connection and fails the same way, so the retry needs its own,
 * never-pooled connection.
 */
function freshDispatcher(): Agent {
  return new Agent({ connections: 1, pipelining: 0 });
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
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey}`);

  try {
    return await fetch(url, { ...init, headers });
  } catch {
    const dispatcher = freshDispatcher();
    try {
      return (await undiciFetch(url, {
        ...init,
        headers,
        dispatcher,
      } as Parameters<typeof undiciFetch>[1])) as unknown as Response;
    } finally {
      void dispatcher.close().catch(() => {});
    }
  }
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
