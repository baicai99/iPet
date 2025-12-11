import { Controller, Get } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';

@Controller('config')
export class SystemConfigController {
    constructor(private readonly systemConfigService: SystemConfigService) { }

    @Get('metrics')
    getMetricConfig() {
        return this.systemConfigService.getMetricConfig();
    }
}
