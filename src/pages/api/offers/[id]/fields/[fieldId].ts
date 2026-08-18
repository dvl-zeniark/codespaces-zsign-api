import type { APIRoute } from "astro";
import { updateField, deleteField, type FieldPlacementInput } from "@/lib/fields";
import { jsonError } from "@/lib/http";

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const id = params.id as string;
    const fieldId = params.fieldId as string;
    const body = (await request.json()) as Partial<FieldPlacementInput>;
    const field = await updateField(id, fieldId, body);
    return new Response(JSON.stringify({ field }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return jsonError(err);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = params.id as string;
    const fieldId = params.fieldId as string;
    await deleteField(id, fieldId);
    return new Response(null, { status: 204 });
  } catch (err) {
    return jsonError(err);
  }
};
