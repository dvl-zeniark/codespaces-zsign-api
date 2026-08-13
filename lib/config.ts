const STAGING_API = "https://stg-zsign.zeniark.net";

export function getConfig() {
  return {
    apiKey: (process.env.ZSIGN_API_KEY || "").trim(),
    apiBase: (process.env.ZSIGN_API_BASE || STAGING_API).replace(/\/+$/, ""),
  };
}
