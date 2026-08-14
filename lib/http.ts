import { NextResponse } from "next/server";
import { ZsignError } from "@/lib/zsign";

export function jsonError(err: unknown) {
  if (err instanceof ZsignError) {
    return NextResponse.json(
      { message: err.message, zsign: err.body },
      { status: err.status },
    );
  }
  const message = err instanceof Error ? err.message : "Unexpected error";
  const cause = (err as { cause?: unknown } | undefined)?.cause;
  return NextResponse.json(
    { message, cause: cause ? String(cause) : undefined },
    { status: 500 },
  );
}
