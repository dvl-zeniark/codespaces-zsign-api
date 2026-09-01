import type { APIRoute } from "astro";
import { getOffer } from "@/lib/offers";
import { jsonError } from "@/lib/http";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const id = params.id as string;
    return new Response(JSON.stringify({ offer: await getOffer(id) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return jsonError(err);
  }
};
