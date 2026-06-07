export function captureOriginPatternFromUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;

  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" ? `${url.origin}/*` : undefined;
  } catch {
    return undefined;
  }
}

export interface CaptureAccessResult {
  granted: boolean;
  origin?: string;
  newlyGranted: boolean;
}

export async function requestCaptureAccess(rawUrl?: string): Promise<CaptureAccessResult> {
  const origin = captureOriginPatternFromUrl(rawUrl);
  if (!origin) return { granted: false, newlyGranted: false };

  const permissions = { origins: [origin] };
  if (await chrome.permissions.contains(permissions)) return { granted: true, origin, newlyGranted: false };
  const granted = await chrome.permissions.request(permissions);
  return { granted, ...(granted ? { origin } : {}), newlyGranted: granted };
}

export async function releaseCaptureAccess(access: CaptureAccessResult): Promise<boolean> {
  if (!access.granted || !access.newlyGranted || !access.origin) return true;
  return chrome.permissions.remove({ origins: [access.origin] });
}
