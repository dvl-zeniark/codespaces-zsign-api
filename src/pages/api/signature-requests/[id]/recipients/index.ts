import type { APIRoute } from "astro";
import { getOffer, MAX_RECIPIENTS } from "@/lib/offers";
import { addRecipients, type RecipientInput } from "@/lib/create-offer";
import { jsonError } from "@/lib/http";

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const id = params.id as string;
    const offer = await getOffer(id);
    const body = (await request.json()) as { recipients?: RecipientInput[] };
    const incoming = Array.isArray(body.recipients) ? body.recipients : [];
    if (!incoming.length) {
      return new Response(JSON.stringify({ message: "At least one recipient is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (offer.recipients.length + incoming.length > MAX_RECIPIENTS) {
      return new Response(
        JSON.stringify({ message: `At most ${MAX_RECIPIENTS} recipients per request` }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const recipients = await addRecipients(id, incoming);
    return new Response(
      JSON.stringify({ offer: await getOffer(id), added: recipients }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return jsonError(err);
  }
};
