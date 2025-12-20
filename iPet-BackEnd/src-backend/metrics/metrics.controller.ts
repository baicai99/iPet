import { Controller, Get, Header, Req, UnauthorizedException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { PrometheusMetricsService } from './prometheus-metrics.service';

@Controller()
export class MetricsController {
  constructor(private readonly metrics: PrometheusMetricsService) {}

  @SkipThrottle()
  @Get('metrics')
  @Header('Content-Type', PrometheusMetricsService.contentType)
  async getMetrics(@Req() req: Request) {
    const configuredToken = this.metrics.getAccessToken();
    if (!configuredToken) {
      return this.metrics.getMetricsText();
    }

    const token =
      (typeof req.headers['x-metrics-token'] === 'string' && req.headers['x-metrics-token']) ||
      (typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.slice('Bearer '.length)
        : undefined);

    if (token !== configuredToken) {
      throw new UnauthorizedException('Invalid metrics token');
    }

    return this.metrics.getMetricsText();
  }
}

