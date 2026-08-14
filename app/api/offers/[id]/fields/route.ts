import { NextRequest, NextResponse } from "next/server";
import {
  placeField,
  type FieldPlacementInput,
} from "@/lib/fields";
import { getOffer } from "@/lib/offers";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = ctx.params;
    const offer = await getOffer(id);
    const body = (await req.json()) as Partial<FieldPlacementInput>;
    const recipientId = String(body.recipientId || "").trim();
    if (!recipientId) {
      return NextResponse.json(
        { message: "Pick a recipient before placing a field" },
        { status: 400 },
      );
    }
    if (!offer.recipients.some((r) => r.id === recipientId)) {
      return NextResponse.json(
        { message: "Recipient is not on this signature request" },
        { status: 400 },
      );
    }
    const input: FieldPlacementInput = {
      recipientId,
      type: body.type || "signature",
      page: Number(body.page) || 1,
      x: Number(body.x),
      y: Number(body.y),
      width: Number(body.width),
      height: Number(body.height),
      required: body.required ?? true,
    };
    const field = await placeField(id, input);
    return NextResponse.json({ field }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
