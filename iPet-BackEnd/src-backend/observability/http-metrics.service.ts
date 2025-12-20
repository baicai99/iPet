import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type MetricKey = string;

type MetricBucket = {
  count: number;
  totalMs: number;
  maxMs: number;
  samplesMs: number[];
};

const percentile = (samples: number[], q: number): number | null => {
  if (!samples.length) {
    return null;
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[index] ?? null;
};

@Injectable()
export class HttpMetricsService {
  private readonly maxSamplesPerKey: number;
  private readonly buckets = new Map<MetricKey, MetricBucket>();

  constructor(private readonly configService: ConfigService) {
    this.maxSamplesPerKey = Math.max(50, this.configService.get<number>('observability.httpMetricsMaxSamples', 500));
  }

  observe(key: MetricKey, durationMs: number): void {
    const safeDuration = Math.max(0, durationMs);
    const bucket = this.buckets.get(key) ?? { count: 0, totalMs: 0, maxMs: 0, samplesMs: [] };

    bucket.count += 1;
    bucket.totalMs += safeDuration;
    bucket.maxMs = Math.max(bucket.maxMs, safeDuration);
    bucket.samplesMs.push(safeDuration);
    while (bucket.samplesMs.length > this.maxSamplesPerKey) {
      bucket.samplesMs.shift();
    }

    this.buckets.set(key, bucket);
  }

  snapshot(): Record<string, unknown> {
    const now = new Date().toISOString();
    const items = [...this.buckets.entries()].map(([key, bucket]) => {
      const avgMs = bucket.count ? bucket.totalMs / bucket.count : 0;
      return {
        key,
        count: bucket.count,
        avgMs: Math.round(avgMs * 100) / 100,
        p95Ms: percentile(bucket.samplesMs, 0.95),
        p99Ms: percentile(bucket.samplesMs, 0.99),
        maxMs: bucket.maxMs,
        sampleSize: bucket.samplesMs.length,
      };
    });

    items.sort((a: any, b: any) => (b.p95Ms ?? 0) - (a.p95Ms ?? 0));
    return { ts: now, items };
  }

  reset(): void {
    this.buckets.clear();
  }
}

