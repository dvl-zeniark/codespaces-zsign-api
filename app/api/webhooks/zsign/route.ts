import { NextRequest, NextResponse } from "next/server";
import { verifyZsignWebhook } from "@/lib/hmac";
import { getWebhookSecret, recordWebhook } from "@/lib/inbox";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const verified = verifyZsignWebhook({
    rawBody,
    signatureHeader: req.headers.get("x-zsign-signature"),
    timestampHeader: req.headers.get("x-zsign-timestamp"),
    secret: getWebhookSecret(),
  });

  if (!verified.ok) {
    return NextResponse.json(
      { received: true, verified: false, error: verified.error },
      { status: 401 },
    );
  }

  recordWebhook(req.headers.get("x-zsign-event") || "unknown");
  return NextResponse.json({ received: true, verified: true });
}
