import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly configService: ConfigService) {
    const dbUrl = configService.get<string>('databaseUrl');

    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });

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
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
