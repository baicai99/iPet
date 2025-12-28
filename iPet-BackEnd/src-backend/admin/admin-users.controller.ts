import { Controller, Get, Patch, Delete, Param, Query, Body, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';
import type { AdminAuthenticatedRequest } from './admin-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles, SuperAdminOnly } from './decorators/roles.decorator';
import { AdminUsersService } from './admin-users.service';
import { AuditLogService } from './audit-log.service';
import { UserListQueryDto, BanUserDto } from './dto/user-management.dto';

@Controller('admin/users')
@UseGuards(AdminAuthGuard, RolesGuard)
export class AdminUsersController {
    constructor(
        private readonly adminUsersService: AdminUsersService,
        private readonly auditLogService: AuditLogService,
    ) { }

    @Get()
    @Roles('admin', 'super_admin')
    async findAll(@Query() query: UserListQueryDto) {
        const filter = {
            search: query.search,
            isGuest: query.isGuest,
            isBanned: query.isBanned,
        };
        const pagination = {
            page: query.page || 1,
            limit: query.limit || 20,
            skip: ((query.page || 1) - 1) * (query.limit || 20),
            take: query.limit || 20,
        };
        return this.adminUsersService.findAll(filter, pagination);
    }

    @Get('guests/stats')
    @Roles('admin', 'super_admin')
    async getGuestStats() {
        return this.adminUsersService.getGuestStats();
    }

    @Get(':id')
    @Roles('admin', 'super_admin')
    async findOne(@Param('id') id: string) {
        return this.adminUsersService.findOne(id);
    }

    @Patch(':id/ban')
    @Roles('admin', 'super_admin')
    @HttpCode(HttpStatus.OK)
    async banUser(
        @Param('id') id: string,
        @Body() body: BanUserDto,
        @Req() req: AdminAuthenticatedRequest,
    ) {
        const result = await this.adminUsersService.banUser(id, body.reason);

        // Audit log
        await this.auditLogService.logBanUser(
            req.admin!.adminId,
            id,
            body.reason || '违反社区规定',
            req.ip,
            req.headers['user-agent'],
        );

        return result;
    }

    @Patch(':id/unban')
    @Roles('admin', 'super_admin')
    @HttpCode(HttpStatus.OK)
    async unbanUser(
        @Param('id') id: string,
        @Req() req: AdminAuthenticatedRequest,
    ) {
        const result = await this.adminUsersService.unbanUser(id);

        // Audit log
        await this.auditLogService.logUnbanUser(
            req.admin!.adminId,
            id,
            req.ip,
            req.headers['user-agent'],
        );

        return result;
    }

    @Delete(':id')
    @SuperAdminOnly() // Only super_admin can soft delete users
    @HttpCode(HttpStatus.OK)
    async deleteUser(
        @Param('id') id: string,
        @Req() req: AdminAuthenticatedRequest,
    ) {
        // Get user info before deletion for audit
        const user = await this.adminUsersService.findOne(id);

        await this.adminUsersService.deleteUser(id, req.admin!.adminId);

        // Audit log
        await this.auditLogService.logDeleteUser(
            req.admin!.adminId,
            id,
            user.email,
            req.ip,
            req.headers['user-agent'],
        );

        return { message: '用户已软删除' };
    }

    @Get('deleted/list')
    @SuperAdminOnly()
    async getDeletedUsers(@Query() query: UserListQueryDto) {
        const pagination = {
            page: query.page || 1,
            limit: query.limit || 20,
            skip: ((query.page || 1) - 1) * (query.limit || 20),
            take: query.limit || 20,
        };
        return this.adminUsersService.getDeletedUsers(pagination);
    }

    @Patch(':id/restore')
    @SuperAdminOnly()
    @HttpCode(HttpStatus.OK)
    async restoreUser(
        @Param('id') id: string,
        @Req() req: AdminAuthenticatedRequest,
    ) {
        const result = await this.adminUsersService.restoreUser(id);

        // Audit log
        await this.auditLogService.log({
            adminId: req.admin!.adminId,
            action: 'restore_user',
            targetType: 'user',
            targetId: id,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });

        return result;
    }

    @Delete(':id/permanent')
    @SuperAdminOnly()
    @HttpCode(HttpStatus.OK)
    async permanentDeleteUser(
        @Param('id') id: string,
        @Req() req: AdminAuthenticatedRequest,
    ) {
        const user = await this.adminUsersService.findOne(id);

        await this.adminUsersService.permanentDeleteUser(id);

        // Audit log
        await this.auditLogService.log({
            adminId: req.admin!.adminId,
            action: 'permanent_delete_user',
            targetType: 'user',
            targetId: id,
            details: { email: user?.email },
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });

        return { message: '用户已永久删除' };
    }
}

