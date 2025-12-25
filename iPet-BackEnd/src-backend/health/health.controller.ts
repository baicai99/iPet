import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, NotFoundException } from '@nestjs/common';
import { HealthService } from './health.service';
import { CreateHealthRecordDto } from './dto/create-health-record.dto';
import { UpdateHealthRecordDto } from './dto/update-health-record.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { parsePagination } from '../utils/pagination';

import { TogglePinDto } from './dto/toggle-pin.dto';

@Controller('health')
@UseGuards(JwtAuthGuard)
export class HealthController {
    constructor(private readonly healthService: HealthService) { }

    @Post('metrics/pin')
    togglePin(@Req() req: AuthenticatedRequest, @Body() togglePinDto: TogglePinDto) {
        const uid = req.user?.uid;
        if (!uid) throw new Error('User ID missing');
        const userId = req.user?.uid;
        if (!userId) throw new NotFoundException('User ID not found');
        return this.healthService.toggleMetricPin(userId, togglePinDto.petId, togglePinDto.metricKey, togglePinDto.isPinned);
    }

    @Post()
    create(@Req() req: AuthenticatedRequest, @Body() createHealthRecordDto: CreateHealthRecordDto) {
        const uid = req.user?.uid;
        if (!uid) throw new Error('User ID missing');
        const userId = req.user?.uid;
        if (!userId) throw new NotFoundException('User ID not found');
        return this.healthService.create(userId, createHealthRecordDto);
    }

    @Get()
    findAll(
        @Req() req: AuthenticatedRequest,
        @Query('petId') petId?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('type') type?: string
    ) {
        const uid = req.user?.uid;
        if (!uid) throw new Error('User ID missing');
        const userId = req.user?.uid;
        if (!userId) throw new NotFoundException('User ID not found');

        const sanitizedPetId = petId?.trim() || undefined;
        const sanitizedType = type?.trim() || undefined;
        const pagination = parsePagination({ page, limit }, { defaultLimit: 50, maxLimit: 200 });

        return this.healthService.findAll(
            userId,
            sanitizedPetId,
            pagination,
            sanitizedType,
        );
    }

    @Get('summary')
    getSummary(@Req() req: AuthenticatedRequest, @Query('petId') petId?: string) {
        const uid = req.user?.uid;
        if (!uid) throw new Error('User ID missing');
        const userId = req.user?.uid;
        if (!userId) throw new NotFoundException('User ID not found');
        const sanitizedPetId = petId?.trim();
        if (!sanitizedPetId) {
            // Missing petId happens early in onboarding; return empty summary instead of throwing.
            return {
                pinnedMetrics: [],
                trends: [],
                dailySummaries: {}
            };
        }

        return this.healthService.getSummary(userId, sanitizedPetId);
    }

    /**
     * ✅ NEW: Get pre-aggregated metric series
     * 
     * Query params:
     * - petId: Pet ID (required)
     * - metricKey: Metric type (required)
     * - range: Time range (day|week|month|six_month|year)
     * - bucket: Aggregation granularity (none|day|week|month)
     * 
     * Performance: Server-side aggregation eliminates client-side main thread blocking
     */
    @Get('series')
    getMetricSeries(
        @Req() req: AuthenticatedRequest,
        @Query('petId') petId: string,
        @Query('metricKey') metricKey: string,
        @Query('range') range?: string,
        @Query('bucket') bucket?: string
    ) {
        const uid = req.user?.uid;
        if (!uid) throw new Error('User ID missing');
        const userId = req.user?.uid;
        if (!userId) throw new NotFoundException('User ID not found');
        if (!petId) throw new Error('Pet ID is required');
        if (!metricKey) throw new Error('Metric key is required');

        return this.healthService.getMetricSeries(
            userId,
            petId,
            metricKey,
            range || 'week',
            bucket || 'none'
        );
    }

    @Get(':id')
    findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        const uid = req.user?.uid;
        if (!uid) throw new Error('User ID missing');
        const userId = req.user?.uid;
        if (!userId) throw new NotFoundException('User ID not found');
        return this.healthService.findOne(id, userId);
    }

    @Patch(':id')
    update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() updateHealthRecordDto: UpdateHealthRecordDto) {
        const uid = req.user?.uid;
        if (!uid) throw new Error('User ID missing');
        const userId = req.user?.uid;
        if (!userId) throw new NotFoundException('User ID not found');
        return this.healthService.update(id, userId, updateHealthRecordDto);
    }

    @Delete(':id')
    remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        const uid = req.user?.uid;
        if (!uid) throw new Error('User ID missing');
        const userId = req.user?.uid;
        if (!userId) throw new NotFoundException('User ID not found');
        return this.healthService.remove(id, userId);
    }
}
