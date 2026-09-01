import type { APIRoute } from "astro";
import { getOffer } from "@/lib/offers";
import { removeRecipient } from "@/lib/create-offer";
import { jsonError } from "@/lib/http";

export const prerender = false;

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = params.id as string;
    const recipientId = params.recipientId as string;
    await removeRecipient(id, recipientId);
    return new Response(JSON.stringify({ offer: await getOffer(id) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return jsonError(err);
  }
};
