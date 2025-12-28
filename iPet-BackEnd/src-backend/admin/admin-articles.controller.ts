import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';
import type { AdminAuthenticatedRequest } from './admin-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles, SuperAdminOnly } from './decorators/roles.decorator';
import { ArticleService } from '../article/article.service';
import { AuditLogService } from './audit-log.service';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';
import { PaginationQueryDto } from './dto/user-management.dto';
import { IsOptional, IsString } from 'class-validator';

class ArticleListQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    search?: string;
}

@Controller('admin/articles')
@UseGuards(AdminAuthGuard, RolesGuard)
export class AdminArticlesController {
    constructor(
        private readonly articleService: ArticleService,
        private readonly auditLogService: AuditLogService,
    ) { }

    @Get()
    @Roles('admin', 'super_admin')
    async findAll(@Query() query: ArticleListQueryDto) {
        const pagination = {
            page: query.page || 1,
            limit: query.limit || 20,
            skip: ((query.page || 1) - 1) * (query.limit || 20),
            take: query.limit || 20,
        };
        return this.articleService.findAllAdmin(query.category, query.search, pagination);
    }

    @Get(':id')
    @Roles('admin', 'super_admin')
    async findOne(@Param('id') id: string) {
        return this.articleService.findOne(id);
    }

    @Post()
    @Roles('admin', 'super_admin')
    async create(
        @Body() dto: CreateArticleDto,
        @Req() req: AdminAuthenticatedRequest,
    ) {
        const result = await this.articleService.create(dto);

        // Audit log
        await this.auditLogService.logArticleCreate(
            req.admin!.adminId,
            result.id,
            result.title,
            req.ip,
            req.headers['user-agent'],
        );

        return result;
    }

    @Patch(':id')
    @Roles('admin', 'super_admin')
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateArticleDto,
        @Req() req: AdminAuthenticatedRequest,
    ) {
        const result = await this.articleService.update(id, dto);

        // Audit log
        await this.auditLogService.logArticleUpdate(
            req.admin!.adminId,
            id,
            dto,
            req.ip,
            req.headers['user-agent'],
        );

        return result;
    }

    @Delete(':id')
    @SuperAdminOnly() // Only super_admin can delete articles
    @HttpCode(HttpStatus.OK)
    async delete(
        @Param('id') id: string,
        @Req() req: AdminAuthenticatedRequest,
    ) {
        // Get article info before deletion for audit
        const article = await this.articleService.findOne(id) as { id: string; title: string } | null;

        await this.articleService.delete(id);

        // Audit log
        await this.auditLogService.logArticleDelete(
            req.admin!.adminId,
            id,
            article?.title || 'Unknown',
            req.ip,
            req.headers['user-agent'],
        );

        return { message: '文章已删除' };
    }
}

