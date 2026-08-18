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

/** Server-only ZSign External API. Key never goes to the browser. */
export async function zsign(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const { apiKey, apiBase } = getConfig();
  const url = `${apiBase}/api/v1/external/${path.replace(/^\/+/, "")}`;
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey}`);

  return fetch(url, { ...init, headers });
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
