import type { APIRoute } from "astro";
import { listDocuments } from "@/lib/documents";
import { uploadDocument } from "@/lib/zsign";
import { jsonError } from "@/lib/http";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    return new Response(JSON.stringify({ documents: await listDocuments() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return jsonError(err);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ message: "Document (PDF) is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const pdfBytes = Buffer.from(await file.arrayBuffer());
    const filename = file.name?.trim() || "document.pdf";
    const doc = await uploadDocument(pdfBytes, filename);
    return new Response(JSON.stringify({ document: doc }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return jsonError(err);
  }
};
