import { NextResponse } from "next/server";
import { zsignJson } from "@/lib/zsign";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pong = await zsignJson<{ pong?: boolean }>("ping");
    return NextResponse.json({ ok: true, pong });
  } catch (err) {
    return jsonError(err);
  }
}
