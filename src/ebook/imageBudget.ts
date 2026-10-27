import type { DeliveryRoute, ImageMode } from "../types";
import type { ResolvedAsset } from "../extraction/assetResolver";

export type AssetSkipReason =
  | "text-only"
  | "mode-cover-only"
  | "decorative"
  | "unsupported-type"
  | "unsafe"
  | "recipe-excluded"
  | "size-budget"
  | "fetch-failed"
  | "permission-denied";

export interface AssetDecision {
  asset: ResolvedAsset;
  include: boolean;
  reason?: AssetSkipReason;
}

export const ROUTE_LIMITS: Record<DeliveryRoute, number> = {
  download: 200 * 1024 * 1024,
  "amazon-web": 200 * 1024 * 1024,
  "email-handoff": 45 * 1024 * 1024
};

export function planImageBudget(assets: ResolvedAsset[], mode: ImageMode, route: DeliveryRoute): AssetDecision[] {
  const limit = ROUTE_LIMITS[route];
  const budget = Math.floor(limit * 0.82);
  let used = 0;
  let coverIncluded = false;

  return assets.map((asset) => {
    if (asset.classification === "unsafe") return skip(asset, "unsafe");
    if (asset.classification === "unsupported") return skip(asset, "unsupported-type");
    if (asset.recipeExcluded) return skip(asset, "recipe-excluded");
    if (asset.classification === "decorative") return skip(asset, "decorative");
    if (mode === "text-only") return skip(asset, "text-only");
    if (mode === "cover-only" && coverIncluded) return skip(asset, "mode-cover-only");
    if (used + asset.estimatedBytes > budget) return skip(asset, "size-budget");

    used += asset.estimatedBytes;
    if (asset.classification === "cover" || mode === "cover-only") coverIncluded = true;
    return { asset, include: true };
  });
}

export function totalEstimatedBytes(decisions: AssetDecision[], baseBytes = 120_000): number {
  return decisions.reduce((sum, decision) => sum + (decision.include ? decision.asset.estimatedBytes : 0), baseBytes);
}

function skip(asset: ResolvedAsset, reason: AssetSkipReason): AssetDecision {
  return { asset, include: false, reason };
}
