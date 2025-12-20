import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ObservabilityController } from './observability.controller';
import { HttpMetricsService } from './http-metrics.service';
import { HttpObservabilityInterceptor } from './http-observability.interceptor';
import { RequestIdMiddleware } from './request-id.middleware';

@Module({
  controllers: [ObservabilityController],
  providers: [
    HttpMetricsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpObservabilityInterceptor,
    },
  ],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
