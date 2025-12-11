import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

import { ServeStaticModule } from '@nestjs/serve-static';
import { UploadsModule } from './uploads/uploads.module';
import { ensureDataSubdir } from './config/data-paths';

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
    CacheModule.register({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    UploadsModule,
    PetsModule,
    HealthModule,
    InsightModule,
    ArticleModule,
    SystemConfigModule,
    HealthScheduleModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
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
