import { NextResponse } from "next/server";
import { listWebhooks } from "@/lib/inbox";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ events: listWebhooks() });
}
