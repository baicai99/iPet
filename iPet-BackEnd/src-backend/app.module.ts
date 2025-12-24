import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import configuration from './config/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PetsModule } from './pets/pets.module';
import { HealthModule } from './health/health.module';
import { InsightModule } from './insight/insight.module';
import { ArticleModule } from './article/article.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { HealthScheduleModule } from './health-schedule/health-schedule.module';
import { GuestCleanupService } from './guest/guest-cleanup.service';

import { ServeStaticModule } from '@nestjs/serve-static';
import { UploadsModule } from './uploads/uploads.module';
import { ensureDataSubdir } from './config/data-paths';
import { Keyv } from 'keyv';
import { createKeyv as createKeyvRedis } from '@keyv/redis';
import { ObservabilityModule } from './observability/observability.module';
import { MetricsModule } from './metrics/metrics.module';
import { SystemHealthModule } from './system-health/system-health.module';
import { InfraModule } from './infra/infra.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ServeStaticModule.forRoot({
      rootPath: ensureDataSubdir('uploads'),
      serveRoot: '/api/uploads',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 100,
      },
    ]),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const namespace = configService.get<string>('cache.namespace', 'ipet');
        const defaultTtlMs = configService.get<number>('cache.defaultTtlMs', 60000);
        const redisUrl = configService.get<string>('redisUrl');

        const stores = [new Keyv({ namespace, ttl: defaultTtlMs })];
        if (redisUrl) {
          stores.push(createKeyvRedis(redisUrl, { namespace }));
        }

        return {
          namespace,
          ttl: defaultTtlMs,
          stores,
          nonBlocking: true,
        };
      },
    }),
    PrismaModule,
    MetricsModule,
    ObservabilityModule,
    UsersModule,
    AuthModule,
    UploadsModule,
    PetsModule,
    HealthModule,
    InsightModule,
    ArticleModule,
    SystemConfigModule,
    HealthScheduleModule,
    SystemHealthModule,
    InfraModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    GuestCleanupService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
