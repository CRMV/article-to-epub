export const FALLBACK_CAPTURE_ORIGIN = "https://*/*";

export function captureOriginPatternFromUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;

  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" ? `${url.origin}/*` : undefined;
  } catch {
    return undefined;
  }
}

export async function requestCaptureAccess(rawUrl?: string): Promise<boolean> {
  const origin = captureOriginPatternFromUrl(rawUrl) ?? FALLBACK_CAPTURE_ORIGIN;
  const permissions = { origins: [origin] };
  if (await chrome.permissions.contains(permissions)) return true;
  return chrome.permissions.request(permissions);
}
