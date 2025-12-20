export const cacheKeys = {
  articles: {
    listByCategory: (category: string) => `articles:category:${category}`,
    byId: (id: string) => `article:id:${id}`,
  },
  health: {
    version: (petId: string) => `health:version:${petId}`,
    summary: (petId: string, version: number) => `health:summary:${petId}:v:${version}`,
    series: (petId: string, metricKey: string, range: string, bucket: string, version: number) =>
      `health:series:${petId}:${metricKey}:${range}:${bucket}:v:${version}`,
  },
} as const;

