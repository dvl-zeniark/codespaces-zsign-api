import type { APIRoute } from "astro";
import { getConfig } from "@/lib/config";
import { jsonError } from "@/lib/http";
import { zsignJson } from "@/lib/zsign";

export const prerender = false;

/** Proxies GET /external/ping so the browser never sees the API key. */
export const GET: APIRoute = async () => {
  const { apiBase } = getConfig();
  try {
    const pong = await zsignJson<{ pong?: boolean }>("ping");
    return new Response(JSON.stringify({ ok: true, pong, apiBase }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return jsonError(err, { apiBase });
  }
};
