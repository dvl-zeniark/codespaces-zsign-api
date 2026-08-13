import { NextResponse } from "next/server";
import { getOffer } from "@/lib/offers";
import { removeRecipient } from "@/lib/create-offer";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; recipientId: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id, recipientId } = await ctx.params;
    await removeRecipient(id, recipientId);
    return NextResponse.json({ offer: await getOffer(id) });
  } catch (err) {
    return jsonError(err);
  }
}
