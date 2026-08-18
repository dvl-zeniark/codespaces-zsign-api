import type { APIRoute } from "astro";
import { listWebhooks } from "@/lib/inbox";

export const prerender = false;

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ events: listWebhooks() }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
