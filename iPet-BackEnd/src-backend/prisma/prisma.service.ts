import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';
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

    const modelFields = new Map(
      Prisma.dmmf.datamodel.models.map(model => [
        model.name,
        new Set(model.fields.map(field => field.name)),
      ]),
    );

    // Middleware to auto-generate CUID2 for ID fields
    this.$use(async (params, next) => {
      const fieldSet = params.model ? modelFields.get(params.model) : undefined;
      const hasIdField = Boolean(fieldSet?.has('id'));

      if (hasIdField && params.action === 'create') {
        if (params.model && !params.args.data.id) {
          params.args.data.id = createId();
        }
      }
      if (hasIdField && params.action === 'createMany') {
        if (params.args.data && Array.isArray(params.args.data)) {
          params.args.data.forEach((item: any) => {
            if (!item.id) {
              item.id = createId();
            }
          });
        } else if (params.args.data && typeof params.args.data === 'object' && !params.args.data.id) {
          params.args.data.id = createId();
        }
      }

      if (!hasIdField && params.action === 'create') {
        if (params.args?.data && typeof params.args.data === 'object' && 'id' in params.args.data) {
          delete params.args.data.id;
        }
      }
      if (!hasIdField && params.action === 'createMany') {
        if (params.args?.data && Array.isArray(params.args.data)) {
          params.args.data.forEach((item: any) => {
            if (item && typeof item === 'object' && 'id' in item) {
              delete item.id;
            }
          });
        } else if (params.args?.data && typeof params.args.data === 'object' && 'id' in params.args.data) {
          delete params.args.data.id;
        }
      }
      return next(params);
    });

    // Middleware to log slow queries
    this.$use(async (params, next) => {
      const start = process.hrtime.bigint();
      let ok = true;
      let result: unknown;
      try {
        result = await next(params);
        return result;
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

        if (isSlow) {
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
