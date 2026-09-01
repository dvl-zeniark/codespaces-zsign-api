import type { APIRoute } from "astro";
import { zsignPdf } from "@/lib/zsign";
import { jsonError } from "@/lib/http";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const id = params.id as string;
    const blob = await zsignPdf(`signature-requests/${id}/preview`);
    const buf = Buffer.from(await blob.arrayBuffer());
    return new Response(buf, {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    });
  } catch (err) {
    return jsonError(err);
  }
};
