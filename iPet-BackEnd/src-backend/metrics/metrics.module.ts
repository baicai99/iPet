import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsController } from './metrics.controller';
import { PrometheusMetricsService } from './prometheus-metrics.service';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [MetricsController],
  providers: [PrometheusMetricsService],
  exports: [PrometheusMetricsService],
})
export class MetricsModule {}

