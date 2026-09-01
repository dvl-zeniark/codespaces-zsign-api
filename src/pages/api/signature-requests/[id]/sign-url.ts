import type { APIRoute } from "astro";
import { getOffer } from "@/lib/offers";
import { zsignJson } from "@/lib/zsign";
import { toSignTabUrl } from "@/lib/sign-url";
import { jsonError } from "@/lib/http";

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const id = params.id as string;
    const offer = await getOffer(id);
    let recipientId = "";
    try {
      const body = (await request.json()) as { recipientId?: string };
      recipientId = String(body.recipientId || "").trim();
    } catch {
      recipientId = "";
    }
    if (!recipientId) recipientId = offer.recipientId;
    if (!recipientId) {
      return new Response(JSON.stringify({ message: "No signer on this request yet" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!offer.recipients.some((r) => r.id === recipientId)) {
      return new Response(
        JSON.stringify({ message: "Recipient is not on this signature request" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const minted = await zsignJson<{ url?: string }>(
      `embed/signature-requests/${id}/recipients/${recipientId}`,
    );
    return new Response(JSON.stringify({ url: toSignTabUrl(minted.url || "") }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return jsonError(err);
  }
};
