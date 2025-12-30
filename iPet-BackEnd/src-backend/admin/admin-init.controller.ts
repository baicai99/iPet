import { Body, Controller, Get, Post, Put, ConflictException, UseGuards, Req, NotFoundException, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';
import { AdminAuthGuard, type AdminAuthenticatedRequest } from './admin-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './decorators/roles.decorator';
import { InitSystemDto } from './dto/admin-init.dto';
import { UpdateAccessConfigDto, UpdateAdminSettingsDto, UpdateEntryPathDto, VerifyAdminPasswordDto } from './dto/admin-settings.dto';
import { AdminInitService } from './admin-init.service';
import { compare } from 'bcrypt';

@Controller('admin')
export class AdminInitController {
    private readonly logger = new Logger(AdminInitController.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly adminService: AdminService,
        private readonly adminInitService: AdminInitService,
    ) { }

    @Get('exists')
    async checkAdminExists() {
        const count = await this.prisma.admin.count();
        return { exists: count > 0 };
    }

    @Post('init')
    async initializeSystem(@Body() dto: InitSystemDto) {
        const exists = await this.prisma.admin.count();
        if (exists > 0) {
            throw new ConflictException('系统已初始化');
        }

        const admin = await this.adminService.createAdmin(
            dto.admin.username,
            dto.admin.email,
            dto.admin.password,
            dto.admin.username,
            'admin'
        );

        try {
            await this.adminInitService.saveConfig({
                accessUrl: dto.accessUrl,
                port: dto.port,
                entryPath: dto.entryPath,
            });
        } catch (error) {
            this.logger.error('Failed to persist init config, rolling back admin creation', error);
            await this.prisma.admin.delete({ where: { id: admin.id } });
            throw error;
        }

        const tokenPayload = this.adminService.generateToken({
            id: admin.id,
            username: admin.username,
            role: admin.role,
            displayName: admin.displayName || admin.username,
        });

        return {
            admin: tokenPayload.admin,
            accessToken: tokenPayload.accessToken,
            message: '系统初始化成功',
        };
    }

    @Get('settings/system-config')
    async getSystemConfig() {
        return this.adminInitService.getConfig();
    }

    @Get('settings')
    @UseGuards(AdminAuthGuard)
    async getAdminSettings(@Req() req: AdminAuthenticatedRequest) {
        const adminId = req.admin?.adminId;
        if (!adminId) {
            throw new NotFoundException('管理员不存在');
        }

        const admin = await this.prisma.admin.findUnique({
            where: { id: adminId },
        });
        if (!admin) {
            throw new NotFoundException('管理员不存在');
        }

        const config = await this.adminInitService.getConfig();

        return {
            username: admin.username,
            email: admin.email,
            port: config.port,
            entryPath: config.entryPath,
        };
    }

    @Put('settings')
    @UseGuards(AdminAuthGuard)
    async updateAdminSettings(
        @Req() req: AdminAuthenticatedRequest,
        @Body() dto: UpdateAdminSettingsDto
    ) {
        const adminId = req.admin?.adminId;
        if (!adminId) {
            throw new NotFoundException('管理员不存在');
        }

        const admin = await this.prisma.admin.findUnique({
            where: { id: adminId },
        });
        if (!admin) {
            throw new NotFoundException('管理员不存在');
        }

        if (dto.password) {
            if (!dto.currentPassword) {
                throw new BadRequestException('请输入旧密码');
            }
            const matches = await compare(dto.currentPassword, admin.passwordHash);
            if (!matches) {
                throw new UnauthorizedException('旧密码错误');
            }
        }

        const config = await this.adminInitService.getConfig();
        const updatedConfig = await this.adminInitService.saveConfig({
            accessUrl: config.accessUrl,
            port: dto.port ?? config.port,
            entryPath: dto.entryPath ?? config.entryPath,
        });

        const updatedAdmin = await this.adminService.updateAdminSettings(adminId, {
            username: dto.username?.trim(),
            email: dto.email?.trim(),
            password: dto.password,
        });

        return {
            username: updatedAdmin.username,
            email: updatedAdmin.email,
            port: updatedConfig.port,
            entryPath: updatedConfig.entryPath,
        };
    }

    @Post('settings/verify-password')
    @UseGuards(AdminAuthGuard)
    async verifyAdminPassword(
        @Req() req: AdminAuthenticatedRequest,
        @Body() dto: VerifyAdminPasswordDto
    ) {
        const adminId = req.admin?.adminId;
        if (!adminId) {
            throw new NotFoundException('管理员不存在');
        }

        const admin = await this.prisma.admin.findUnique({
            where: { id: adminId },
        });
        if (!admin) {
            throw new NotFoundException('管理员不存在');
        }

        const matches = await compare(dto.currentPassword, admin.passwordHash);
        if (!matches) {
            throw new UnauthorizedException('旧密码错误');
        }

        return { valid: true };
    }

    @Put('settings/entry-path')
    @UseGuards(AdminAuthGuard, RolesGuard)
    @Roles('admin')
    async updateEntryPath(
        @Req() req: AdminAuthenticatedRequest,
        @Body() dto: UpdateEntryPathDto
    ) {
        const admin = await this.prisma.admin.findUnique({
            where: { id: req.admin?.adminId },
        });
        if (!admin) {
            throw new NotFoundException('管理员不存在');
        }
        const matches = await compare(dto.currentPassword, admin.passwordHash);
        if (!matches) {
            throw new UnauthorizedException('密码错误');
        }

        const config = await this.adminInitService.getConfig();
        const updated = await this.adminInitService.saveConfig({
            ...config,
            entryPath: dto.newPath,
        });

        const baseUrl = updated.accessUrl.replace(/\/$/, '');
        const port = updated.port;
        let url = baseUrl;
        if (port && !baseUrl.includes(':' + port) && port !== 80 && port !== 443) {
            url = `${baseUrl}:${port}`;
        }

        return {
            newPath: updated.entryPath,
            newLoginUrl: `${url}/${updated.entryPath}/login`,
        };
    }

    @Put('settings/access-config')
    @UseGuards(AdminAuthGuard, RolesGuard)
    @Roles('admin')
    async updateAccessConfig(@Body() dto: UpdateAccessConfigDto) {
        const config = await this.adminInitService.getConfig();
        await this.adminInitService.saveConfig({
            ...config,
            accessUrl: dto.url,
            port: dto.port,
        });
        return { ok: true };
    }
}
