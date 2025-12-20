import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';

const httpDurationBucketsMs = [5, 10, 25, 50, 100, 200, 500, 1000, 2500, 5000];
const dbDurationBucketsMs = [1, 2.5, 5, 10, 25, 50, 100, 200, 500, 1000, 2500, 5000];

@Injectable()
export class PrometheusMetricsService {
  static readonly contentType = 'text/plain; version=0.0.4; charset=utf-8';

  private readonly registry = new Registry();
  private readonly httpRequestsTotal: Counter<'method' | 'route' | 'status'>;
  private readonly httpRequestDurationMs: Histogram<'method' | 'route' | 'status'>;
  private readonly dbQueryDurationMs: Histogram<'model' | 'action' | 'ok'>;
  private readonly dbSlowQueriesTotal: Counter<'model' | 'action'>;
  private readonly metricsToken?: string;

  constructor(private readonly configService: ConfigService) {
    this.metricsToken = this.configService.get<string>('observability.metricsToken') || undefined;

    collectDefaultMetrics({
      register: this.registry,
      prefix: 'ipet_',
    });

    this.httpRequestsTotal = new Counter({
      name: 'ipet_http_requests_total',
      help: 'Total HTTP requests',
      registers: [this.registry],
      labelNames: ['method', 'route', 'status'],
    });

    this.httpRequestDurationMs = new Histogram({
      name: 'ipet_http_request_duration_ms',
      help: 'HTTP request duration in milliseconds',
      registers: [this.registry],
      labelNames: ['method', 'route', 'status'],
      buckets: httpDurationBucketsMs,
    });

    this.dbQueryDurationMs = new Histogram({
      name: 'ipet_db_query_duration_ms',
      help: 'Prisma query duration in milliseconds',
      registers: [this.registry],
      labelNames: ['model', 'action', 'ok'],
      buckets: dbDurationBucketsMs,
    });

    this.dbSlowQueriesTotal = new Counter({
      name: 'ipet_db_slow_queries_total',
      help: 'Total slow Prisma queries (duration >= threshold)',
      registers: [this.registry],
      labelNames: ['model', 'action'],
    });
  }

  getAccessToken(): string | undefined {
    return this.metricsToken;
  }

  observeHttpRequest(options: {
    method: string;
    route: string;
    statusCode: number;
    durationMs: number;
  }): void {
    const method = (options.method || 'GET').toUpperCase();
    const route = options.route || 'unknown';
    const status = String(options.statusCode || 0);
    const durationMs = Math.max(0, options.durationMs);

    this.httpRequestsTotal.inc({ method, route, status }, 1);
    this.httpRequestDurationMs.observe({ method, route, status }, durationMs);
  }

  observeDbQuery(options: {
    model?: string;
    action?: string;
    ok: boolean;
    durationMs: number;
    isSlow: boolean;
  }): void {
    const model = options.model || 'unknown';
    const action = options.action || 'unknown';
    const ok = options.ok ? 'true' : 'false';
    const durationMs = Math.max(0, options.durationMs);

    this.dbQueryDurationMs.observe({ model, action, ok }, durationMs);
    if (options.isSlow) {
      this.dbSlowQueriesTotal.inc({ model, action }, 1);
    }
  }

  async getMetricsText(): Promise<string> {
    return await this.registry.metrics();
  }
}

