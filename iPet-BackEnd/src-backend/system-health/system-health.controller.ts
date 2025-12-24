import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SystemHealthService } from './system-health.service';

@Controller('system')
export class SystemHealthController {
    constructor(private readonly systemHealthService: SystemHealthService) { }

    /**
     * GET /api/system/health
     * Liveness probe - returns basic health status
     */
    @Get('health')
    @HttpCode(HttpStatus.OK)
    getHealth() {
        return this.systemHealthService.getHealthInfo();
    }

    /**
     * GET /api/system/ready
     * Readiness probe - checks DB connectivity
     * Returns 503 if DB is not connected
     */
    @Get('ready')
    async getReady(@Res() res: Response) {
        const readiness = await this.systemHealthService.getReadiness();

        if (readiness.db === 'disconnected') {
            return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(readiness);
        }

        return res.status(HttpStatus.OK).json(readiness);
    }
}
