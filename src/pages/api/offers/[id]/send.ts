import type { APIRoute } from "astro";
import { sendOffer } from "@/lib/create-offer";
import { jsonError } from "@/lib/http";

export const prerender = false;

export const POST: APIRoute = async ({ params }) => {
  try {
    const id = params.id as string;
    const offer = await sendOffer(id);
    return new Response(JSON.stringify({ offer }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return jsonError(err);
  }
};
