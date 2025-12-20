import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { catchError, finalize, throwError } from 'rxjs';
import { HttpMetricsService } from './http-metrics.service';
import { ObservabilityLogger } from './observability-logger.service';
import { PrometheusMetricsService } from '../metrics/prometheus-metrics.service';

const stripQuery = (url: string): string => url.split('?')[0] || url;

const resolveRouteLabel = (req: Request): string => {
  const method = (req.method || 'GET').toUpperCase();
  const baseUrl = req.baseUrl || '';
  const routePath = typeof (req as any).route?.path === 'string' ? (req as any).route.path : undefined;
  const path = routePath ? `${baseUrl}${routePath}` : stripQuery(req.originalUrl || req.url || '');
  return `${method} ${path}`;
};

@Injectable()
export class HttpObservabilityInterceptor implements NestInterceptor {
  constructor(
    private readonly metrics: HttpMetricsService,
    private readonly logger: ObservabilityLogger,
    private readonly prom: PrometheusMetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const start = process.hrtime.bigint();
    let logged = false;

    const requestId = (req as any).requestId;
    const method = (req.method || '').toUpperCase();
    const url = stripQuery(req.originalUrl || req.url || '');

    return next.handle().pipe(
      catchError((error) => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        const exceptionStatus =
          typeof (error as any)?.status === 'number'
            ? (error as any).status
            : typeof (error as any)?.getStatus === 'function'
              ? (error as any).getStatus()
              : undefined;
        const statusCode = exceptionStatus || res?.statusCode || 500;
        const key = resolveRouteLabel(req);

        this.metrics.observe(key, durationMs);
        this.prom.observeHttpRequest({
          method,
          route: key,
          statusCode,
          durationMs,
        });
        this.logger.error({
          type: 'http.request',
          requestId,
          method,
          url,
          statusCode,
          durationMs: Math.round(durationMs * 100) / 100,
          error: error?.message || String(error),
        });
        logged = true;

        return throwError(() => error);
      }),
      finalize(() => {
        if (logged) {
          return;
        }
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        const statusCode = res?.statusCode || 200;
        const key = resolveRouteLabel(req);

        this.metrics.observe(key, durationMs);
        this.prom.observeHttpRequest({
          method,
          route: key,
          statusCode,
          durationMs,
        });
        this.logger.info({
          type: 'http.request',
          requestId,
          method,
          url,
          statusCode,
          durationMs: Math.round(durationMs * 100) / 100,
          userId: (req as any).user?.uid,
        });
      }),
    );
  }
}
