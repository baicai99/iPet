export const CACHE_TTL_MS = {
  articlesList: 5 * 60 * 1000,
  articleDetail: 10 * 60 * 1000,
  healthSummary: 30 * 1000,
  healthSeries: 60 * 1000,
  healthVersion: 7 * 24 * 60 * 60 * 1000,
} as const;

export const CACHE_TTL_JITTER_RATIO = 0.1;

