import { createHmac, timingSafeEqual } from "node:crypto";

const SKEW_SEC = 5 * 60;

export type HmacResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * ZSign partner webhooks: HMAC-SHA256 of raw body.
 * Header X-ZSign-Signature: sha256=<hex>
 * Timestamp is NOT part of the HMAC input (docs/webhooks.mdx).
 */
export function verifyZsignWebhook(opts: {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  secret: string;
  nowSec?: number;
}): HmacResult {
  const { rawBody, signatureHeader, timestampHeader, secret } = opts;
  const now = opts.nowSec ?? Math.floor(Date.now() / 1000);

  if (!secret) {
    return { ok: false, error: "Set ZSIGN_WEBHOOK_SECRET in .env.local" };
  }
  if (!signatureHeader) {
    return { ok: false, error: "Missing X-ZSign-Signature" };
  }
  if (!timestampHeader) {
    return { ok: false, error: "Missing X-ZSign-Timestamp" };
  }

  const ts = Number(timestampHeader);
  if (!Number.isFinite(ts)) {
    return { ok: false, error: "Invalid X-ZSign-Timestamp" };
  }
  if (Math.abs(now - ts) > SKEW_SEC) {
    return { ok: false, error: "Timestamp outside allowed skew (~5 min)" };
  }

  const expectedHex = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  const expected = `sha256=${expectedHex}`;

  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader.trim());
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, error: "Signature mismatch" };
  }
  return { ok: true };
}
