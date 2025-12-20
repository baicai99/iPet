import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { ObservabilityLogger } from '../observability/observability-logger.service';
import { MetricsModule } from '../metrics/metrics.module';

@Global()
@Module({
  imports: [ConfigModule, MetricsModule],
  providers: [PrismaService, ObservabilityLogger],
  exports: [PrismaService, ObservabilityLogger],
})
export class PrismaModule {}
