import type { APIRoute } from "astro";
import { verifyZsignWebhook } from "@/lib/hmac";
import { getWebhookSecret, recordWebhook } from "@/lib/inbox";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text();
  const verified = verifyZsignWebhook({
    rawBody,
    signatureHeader: request.headers.get("x-zsign-signature"),
    timestampHeader: request.headers.get("x-zsign-timestamp"),
    secret: getWebhookSecret(),
  });

  if (!verified.ok) {
    return new Response(
      JSON.stringify({ received: true, verified: false, error: verified.error }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  recordWebhook(request.headers.get("x-zsign-event") || "unknown");
  return new Response(JSON.stringify({ received: true, verified: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
