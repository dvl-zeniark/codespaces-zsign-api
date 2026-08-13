export function getConfig() {
  return {
    apiKey: (process.env.ZSIGN_API_KEY || "").trim(),
    apiBase: (
      process.env.ZSIGN_API_BASE || "http://127.0.0.1:3001"
    ).replace(/\/+$/, ""),
  };
}
