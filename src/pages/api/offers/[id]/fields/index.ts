import type { APIRoute } from "astro";
import { placeField, type FieldPlacementInput } from "@/lib/fields";
import { getOffer } from "@/lib/offers";
import { jsonError } from "@/lib/http";

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const id = params.id as string;
    const offer = await getOffer(id);
    const body = (await request.json()) as Partial<FieldPlacementInput>;
    const recipientId = String(body.recipientId || "").trim();
    if (!recipientId) {
      return new Response(
        JSON.stringify({ message: "Pick a recipient before placing a field" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    if (!offer.recipients.some((r) => r.id === recipientId)) {
      return new Response(
        JSON.stringify({ message: "Recipient is not on this signature request" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
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
    return new Response(JSON.stringify({ field }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return jsonError(err);
  }
};
