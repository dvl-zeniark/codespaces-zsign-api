/** Mint returns an absolute URL. Tab/email signing uses /sign/{token} on that origin. */
export function toSignTabUrl(mintedUrl: string): string {
  try {
    const u = new URL(mintedUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    const embedIdx = parts.indexOf("embed");
    const signIdx = parts.indexOf("sign");
    if (embedIdx >= 0 && signIdx === embedIdx + 1 && parts[signIdx + 1]) {
      u.pathname = `/sign/${parts[signIdx + 1]}`;
      return u.toString();
    }
  } catch {
    /* fall through */
  }
  return mintedUrl;
}
