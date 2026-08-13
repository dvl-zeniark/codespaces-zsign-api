import { getConfig } from "@/lib/config";

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
  if (!apiKey) {
    throw new ZsignError(401, {
      message: "Set ZSIGN_API_KEY in .env (your org key from ZSign Integrations)",
    });
  }
  const url = `${apiBase}/api/v1/external/${path.replace(/^\/+/, "")}`;
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey}`);
  if (!headers.has("Idempotency-Key") && init.method && init.method !== "GET") {
    headers.set("Idempotency-Key", crypto.randomUUID());
  }
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
