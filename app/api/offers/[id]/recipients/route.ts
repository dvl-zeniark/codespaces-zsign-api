import { NextRequest, NextResponse } from "next/server";
import { getOffer, MAX_RECIPIENTS } from "@/lib/offers";
import {
  addRecipients,
  type RecipientInput,
} from "@/lib/create-offer";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = ctx.params;
    const offer = await getOffer(id);
    const body = (await req.json()) as { recipients?: RecipientInput[] };
    const incoming = Array.isArray(body.recipients) ? body.recipients : [];
    if (!incoming.length) {
      return NextResponse.json(
        { message: "At least one recipient is required" },
        { status: 400 },
      );
    }
    if (offer.recipients.length + incoming.length > MAX_RECIPIENTS) {
      return NextResponse.json(
        {
          message: `At most ${MAX_RECIPIENTS} recipients per request`,
        },
        { status: 400 },
      );
    }
    const recipients = await addRecipients(id, incoming);
    return NextResponse.json(
      { offer: await getOffer(id), added: recipients },
      { status: 201 },
    );
  } catch (err) {
    return jsonError(err);
  }
}
