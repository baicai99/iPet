export const ttlWithJitter = (baseTtlMs: number, jitterRatio = 0.1): number => {
  if (!Number.isFinite(baseTtlMs) || baseTtlMs <= 0) return baseTtlMs;
  const jitter = (Math.random() * 2 - 1) * jitterRatio * baseTtlMs;
  return Math.max(1, Math.floor(baseTtlMs + jitter));
};

