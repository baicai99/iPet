import { Controller, Delete, Get } from '@nestjs/common';
import { HttpMetricsService } from './http-metrics.service';

@Controller('observability')
export class ObservabilityController {
  constructor(private readonly httpMetrics: HttpMetricsService) {}

  @Get('http-metrics')
  getHttpMetrics() {
    return this.httpMetrics.snapshot();
  }

  @Delete('http-metrics')
  resetHttpMetrics() {
    this.httpMetrics.reset();
    return { ok: true };
  }
}

