import { NextRequest, NextResponse } from "next/server";
import { updateField, deleteField, type FieldPlacementInput } from "@/lib/fields";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; fieldId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id, fieldId } = await ctx.params;
    const body = (await req.json()) as Partial<FieldPlacementInput>;
    const field = await updateField(id, fieldId, body);
    return NextResponse.json({ field });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id, fieldId } = await ctx.params;
    await deleteField(id, fieldId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return jsonError(err);
  }
}
