import { Module } from '@nestjs/common';
import { InfraHealthController } from './infra-health.controller';

/**
 * Infrastructure Module
 * 
 * 提供基础设施相关功能：
 * - 健康检查 (/api/infra/health)
 */
@Module({
    controllers: [InfraHealthController],
})
export class InfraModule { }
