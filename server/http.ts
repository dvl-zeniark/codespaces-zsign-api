import type { Response } from "express";
import { ZsignError } from "../lib/zsign.ts";

export function jsonError(res: Response, err: unknown) {
  if (err instanceof ZsignError) {
    return res.status(err.status).json({
      message: err.message,
      zsign: err.body,
    });
  }
  const message = err instanceof Error ? err.message : "Unexpected error";
  return res.status(500).json({ message });
}
