import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { InsightService } from './insight.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('insights')
@UseGuards(JwtAuthGuard)
export class InsightController {
    constructor(private readonly insightService: InsightService) { }

    @Get('trend')
    getTrendInsight(@Query('key') key: string, @Query('direction') direction: string) {
        return this.insightService.getTrendInsight(key, direction);
    }

    @Get(':key')
    getInsight(@Param('key') key: string) {
        return this.insightService.getInsight(key);
    }
}
