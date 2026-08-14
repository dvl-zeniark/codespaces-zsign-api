import { NextResponse } from "next/server";
import { sendOffer } from "@/lib/create-offer";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function POST(_req: Request, ctx: Ctx) {
  try {
    const { id } = ctx.params;
    const offer = await sendOffer(id);
    return NextResponse.json({ offer });
  } catch (err) {
    return jsonError(err);
  }
}
