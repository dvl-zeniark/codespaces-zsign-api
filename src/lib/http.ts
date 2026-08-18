import { ZsignError } from "@/lib/zsign";

export function jsonError(err: unknown, extra?: Record<string, unknown>): Response {
  if (err instanceof ZsignError) {
    return new Response(
      JSON.stringify({ message: err.message, zsign: err.body, ...extra }),
      { status: err.status, headers: { "Content-Type": "application/json" } },
    );
  }
  const message = err instanceof Error ? err.message : "Unexpected error";
  const cause = (err as { cause?: unknown } | undefined)?.cause;
  return new Response(
    JSON.stringify({ message, cause: cause ? String(cause) : undefined, ...extra }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
}
