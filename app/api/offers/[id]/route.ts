import { NextResponse } from "next/server";
import { getOffer } from "@/lib/offers";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = ctx.params;
    return NextResponse.json({ offer: await getOffer(id) });
  } catch (err) {
    return jsonError(err);
  }
}
