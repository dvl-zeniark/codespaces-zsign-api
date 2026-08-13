import { NextRequest, NextResponse } from "next/server";
import { getOffer } from "@/lib/offers";
import { zsignJson } from "@/lib/zsign";
import { toSignTabUrl } from "@/lib/sign-url";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const offer = await getOffer(id);
    let recipientId = "";
    try {
      const body = (await req.json()) as { recipientId?: string };
      recipientId = String(body.recipientId || "").trim();
    } catch {
      recipientId = "";
    }
    if (!recipientId) recipientId = offer.recipientId;
    if (!recipientId) {
      return NextResponse.json(
        { message: "No signer on this request yet" },
        { status: 400 },
      );
    }
    if (!offer.recipients.some((r) => r.id === recipientId)) {
      return NextResponse.json(
        { message: "Recipient is not on this signature request" },
        { status: 400 },
      );
    }
    const minted = await zsignJson<{ url?: string }>(
      `embed/signature-requests/${id}/recipients/${recipientId}`,
    );
    return NextResponse.json({ url: toSignTabUrl(minted.url || "") });
  } catch (err) {
    return jsonError(err);
  }
}
