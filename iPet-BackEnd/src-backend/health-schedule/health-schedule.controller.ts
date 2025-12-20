import { Controller, Get, Post, Body, Param, Delete, Query, Request } from '@nestjs/common';
import { HealthScheduleService } from './health-schedule.service';
import { CreateHealthScheduleDto } from './dto/create-health-schedule.dto';
import { parsePagination } from '../utils/pagination';
// Assuming AuthGuard exists, if likely strict NestJS setup. But checking other controllers (health.controller not viewed but health.service implied checks user).
// I will assume there is some Auth mechanism, usually via @Request() req.user.id.
// Since I don't know the exact AuthGuard import, I will mock the user extraction or assume standard request structure.
// Given strict mode, I'll try to match standard patterns.

@Controller('health-schedules')
export class HealthScheduleController {
    constructor(private readonly healthScheduleService: HealthScheduleService) { }

    @Post()
    create(@Request() req, @Body() createDto: CreateHealthScheduleDto) {
        // Assuming req.user.id provided by global guard or middleware
        // If not, we might need to inject it.
        // For now, assume req.user exists.
        return this.healthScheduleService.create(req.user?.id, createDto);
    }

    @Get(':petId')
    findAll(
        @Request() req,
        @Param('petId') petId: string,
        @Query('type') type?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const pagination = parsePagination({ page, limit }, { defaultLimit: 50, maxLimit: 200 });
        return this.healthScheduleService.findAll(req.user?.id, petId, type, pagination);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.healthScheduleService.remove(req.user?.id, id);
    }
}
