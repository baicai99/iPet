import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';
import { getRequestId } from '../observability/request-context';
import { ObservabilityLogger } from '../observability/observability-logger.service';
import { PrometheusMetricsService } from '../metrics/prometheus-metrics.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly slowQueryMs: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: ObservabilityLogger,
    private readonly metrics: PrometheusMetricsService,
  ) {
    const dbUrl = configService.get<string>('databaseUrl');
    const configuredSlowQueryMs = configService.get<number>('observability.prismaSlowQueryMs', 100);

    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });

    this.slowQueryMs = Math.max(0, configuredSlowQueryMs);

    // Middleware to auto-generate CUID2 for ID fields
    this.$use(async (params, next) => {
      if (params.action === 'create') {
        if (params.model && !params.args.data.id) {
          params.args.data.id = createId();
        }
      }
      if (params.action === 'createMany') {
        if (params.args.data && Array.isArray(params.args.data)) {
          params.args.data.forEach((item: any) => {
            if (!item.id) {
              item.id = createId();
            }
          });
        }
      }
      return next(params);
    });

    // Middleware to log slow queries
    this.$use(async (params, next) => {
      const start = process.hrtime.bigint();
      let ok = true;
      try {
        return await next(params);
      } catch (error) {
        ok = false;
        throw error;
      } finally {
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        const isSlow = durationMs >= this.slowQueryMs;

        this.metrics.observeDbQuery({
          model: params.model,
          action: params.action,
          ok,
          durationMs,
          isSlow,
        });

        if (!isSlow) {
          return;
        }

        const where = (params as any)?.args?.where;
        const whereKeys =
          where && typeof where === 'object' && !Array.isArray(where) ? Object.keys(where) : undefined;

        this.logger.warn({
          type: 'db.slow_query',
          requestId: getRequestId(),
          model: params.model,
          action: params.action,
          durationMs: Math.round(durationMs * 100) / 100,
          whereKeys,
        });
      }
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
