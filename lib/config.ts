export function getConfig() {
  return {
    apiKey: (process.env.ZSIGN_API_KEY || "").trim(),
    apiBase: (process.env.ZSIGN_API_BASE || "").replace(/\/+$/, ""),
  };
}
