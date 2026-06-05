export interface ImageTransformPlan {
  maxWidth: number;
  quality: number;
}

export function imageTransformPlanForEstimatedSize(estimatedBytes: number): ImageTransformPlan {
  if (estimatedBytes > 1_000_000) return { maxWidth: 1200, quality: 0.78 };
  if (estimatedBytes > 500_000) return { maxWidth: 1400, quality: 0.82 };
  return { maxWidth: 1600, quality: 0.86 };
}

