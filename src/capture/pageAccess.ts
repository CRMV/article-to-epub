export function captureOriginPatternFromUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;

  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" ? `${url.origin}/*` : undefined;
  } catch {
    return undefined;
  }
}

export async function hasCaptureAccess(rawUrl?: string): Promise<boolean> {
  const origin = captureOriginPatternFromUrl(rawUrl);
  if (!origin) return false;

  return chrome.permissions.contains({ origins: [origin] });
}
