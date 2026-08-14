import { NextResponse } from "next/server";
import { zsignPdf } from "@/lib/zsign";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = ctx.params;
    const blob = await zsignPdf(`signature-requests/${id}/preview`);
    const buf = Buffer.from(await blob.arrayBuffer());
    return new NextResponse(buf, {
      headers: { "Content-Type": "application/pdf" },
    });
  } catch (err) {
    return jsonError(err);
  }
}
