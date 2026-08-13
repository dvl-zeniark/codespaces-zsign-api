import { NextRequest, NextResponse } from "next/server";
import { listDocuments } from "@/lib/documents";
import { uploadDocument } from "@/lib/zsign";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ documents: await listDocuments() });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { message: "Document (PDF) is required" },
        { status: 400 },
      );
    }
    const pdfBytes = Buffer.from(await file.arrayBuffer());
    const filename = file.name?.trim() || "document.pdf";
    const doc = await uploadDocument(pdfBytes, filename);
    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
