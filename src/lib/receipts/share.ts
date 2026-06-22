/**
 * Build the absolute public receipt URL for sharing / QR encoding.
 *
 * Pure. If `appUrl` is empty, returns a relative path so the caller can still render
 * a working link in environments where the base URL isn't configured.
 */
export function receiptShareUrl(appUrl: string, id: string): string {
  const base = (appUrl ?? "").replace(/\/+$/, "");
  const path = `/receipt/${encodeURIComponent(id)}`;
  return base ? `${base}${path}` : path;
}
