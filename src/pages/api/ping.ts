import type { APIRoute } from "astro";
import { zsignJson, ZsignError } from "../../lib/zsign";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const body = await zsignJson("ping");
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    if (err instanceof ZsignError) {
      return new Response(JSON.stringify({ message: err.message, zsign: err.body }), {
        status: err.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(JSON.stringify({ message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
