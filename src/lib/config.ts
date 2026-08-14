import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "dotenv";

const STAGING_API = "https://stg-zsign.zeniark.net";

/**
 * import.meta.env is only read once, at dev-server startup - editing
 * .env.local afterward (e.g. pasting a key into an already-running
 * StackBlitz preview) has no effect until the server restarts. Re-reading
 * the file on every call avoids that: a saved edit takes effect on the
 * next request.
 */
function readEnvLocal(): Record<string, string> {
  try {
    return parse(readFileSync(join(process.cwd(), ".env.local"), "utf8"));
  } catch {
    return {};
  }
}

export function getConfig() {
  const fileEnv = readEnvLocal();
  return {
    apiKey: (fileEnv.ZSIGN_API_KEY || import.meta.env.ZSIGN_API_KEY || "").trim(),
    apiBase: (
      fileEnv.ZSIGN_API_BASE ||
      import.meta.env.ZSIGN_API_BASE ||
      STAGING_API
    ).replace(/\/+$/, ""),
  };
}
