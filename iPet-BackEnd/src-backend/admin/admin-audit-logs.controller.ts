import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './decorators/roles.decorator';
import { AuditLogService } from './audit-log.service';
import { PaginationQueryDto } from './dto/user-management.dto';

@Controller('admin/audit-logs')
@UseGuards(AdminAuthGuard, RolesGuard)
export class AdminAuditLogsController {
    constructor(private readonly auditLogService: AuditLogService) { }

    @Get()
    @Roles('admin')
    async findAll(@Query() query: PaginationQueryDto) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const pagination = {
            page,
            limit,
            skip: (page - 1) * limit,
            take: limit,
        };

        return this.auditLogService.getLogs(pagination);
    }
}
