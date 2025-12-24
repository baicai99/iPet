import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ObservabilityController } from './observability.controller';
import { HttpMetricsService } from './http-metrics.service';
import { HttpObservabilityInterceptor } from './http-observability.interceptor';
import { RequestIdMiddleware } from './request-id.middleware';
import { ObservabilityLogger } from './observability-logger.service';
import { GlobalExceptionFilter } from './global-exception.filter';

@Module({
  controllers: [ObservabilityController],
  providers: [
    HttpMetricsService,
    ObservabilityLogger,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpObservabilityInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [ObservabilityLogger],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
