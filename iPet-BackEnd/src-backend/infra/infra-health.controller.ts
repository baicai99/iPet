import { Controller, Get } from '@nestjs/common';

/**
 * Infrastructure Health Check Controller
 * 
 * 提供基础设施健康检查端点，用于部署验证和监控。
 * 
 * 注意：此端点与 /api/health（宠物健康记录）是独立的。
 */
@Controller('infra')
export class InfraHealthController {
    private readonly startTime = Date.now();

    /**
     * GET /api/infra/health
     * 
     * 基础健康检查 - 验证服务是否运行
     */
    @Get('health')
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '0.0.1',
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
        };
    }
}
