import type { AssetCandidate } from "../types";

export interface PermissionPlan {
  requiredOrigins: string[];
  optionalHostPatterns: string[];
}

export function planAssetPermissions(pageUrl: string, assets: AssetCandidate[]): PermissionPlan {
  const pageOrigin = safeOrigin(pageUrl);
  const origins = new Set<string>();

  for (const asset of assets) {
    const origin = safeOrigin(asset.url);
    if (!origin || origin === pageOrigin || !origin.startsWith("https://")) continue;
    origins.add(origin);
  }

  const requiredOrigins = [...origins].sort();
  return {
    requiredOrigins,
    optionalHostPatterns: requiredOrigins.map((origin) => `${origin}/*`)
  };
}

export async function requestAssetOrigins(origins: string[]): Promise<boolean> {
  if (origins.length === 0) return true;
  return chrome.permissions.request({
    origins: origins.map((origin) => `${origin}/*`)
  });
}

export async function removeAssetOrigins(origins: string[]): Promise<boolean> {
  if (origins.length === 0) return true;
  return chrome.permissions.remove({
    origins: origins.map((origin) => `${origin}/*`)
  });
}

function safeOrigin(rawUrl: string): string | undefined {
  try {
    return new URL(rawUrl).origin;
  } catch {
    return undefined;
  }
}

