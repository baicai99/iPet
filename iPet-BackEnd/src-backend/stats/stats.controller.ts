import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../admin/admin-auth.guard';
import { RolesGuard } from '../admin/roles.guard';
import { Roles } from '../admin/decorators/roles.decorator';
import { StatsService } from './stats.service';
import { TrendQueryDto } from '../admin/dto/stats.dto';

@Controller('admin/stats')
@UseGuards(AdminAuthGuard, RolesGuard)
export class StatsController {
    constructor(private readonly statsService: StatsService) { }

    @Get('dashboard')
    @Roles('admin', 'super_admin')
    async getDashboardStats() {
        return this.statsService.getDashboardStats();
    }

    @Get('users/trend')
    @Roles('admin', 'super_admin')
    async getUserTrend(@Query() query: TrendQueryDto) {
        return this.statsService.getUserTrend(query.days || 30);
    }

    @Get('records/trend')
    @Roles('admin', 'super_admin')
    async getRecordTrend(@Query() query: TrendQueryDto) {
        return this.statsService.getRecordTrend(query.days || 30);
    }
}
