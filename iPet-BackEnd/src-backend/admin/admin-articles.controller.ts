import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';
import type { AdminAuthenticatedRequest } from './admin-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './decorators/roles.decorator';
import { ArticleService } from '../article/article.service';
import { AuditLogService } from './audit-log.service';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';
import { CreateArticleCategoryDto, UpdateArticleCategoryDto } from './dto/article-category.dto';
import { BulkDeleteArticlesDto, BulkUpdateArticleCategoryDto, BulkUpdateArticlePinDto } from './dto/article-bulk.dto';
import { PaginationQueryDto } from './dto/user-management.dto';
import { IsOptional, IsString } from 'class-validator';

class ArticleListQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    pinned?: string;
}

@Controller('admin/articles')
@UseGuards(AdminAuthGuard, RolesGuard)
export class AdminArticlesController {
    constructor(
        private readonly articleService: ArticleService,
        private readonly auditLogService: AuditLogService,
    ) { }

    @Get()
    @Roles('admin')
    async findAll(@Query() query: ArticleListQueryDto) {
        const pagination = {
            page: query.page || 1,
            limit: query.limit || 20,
            skip: ((query.page || 1) - 1) * (query.limit || 20),
            take: query.limit || 20,
        };
        const pinned = query.pinned === 'true' ? true : query.pinned === 'false' ? false : undefined;
        return this.articleService.findAllAdmin(query.category, query.search, pagination, false, pinned);
    }

    @Get('categories')
    @Roles('admin')
    async getCategories() {
        return this.articleService.getCategories();
    }

    @Post('categories')
    @Roles('admin')
    async createCategory(
        @Body() dto: CreateArticleCategoryDto,
        @Req() req: AdminAuthenticatedRequest,
    ) {
        const result = await this.articleService.createCategory(dto);
        await this.auditLogService.log({
            adminId: req.admin?.adminId,
            action: 'create_article_category',
            targetType: 'article_category',
            targetId: result.key,
            details: { key: result.key, label: result.label, order: result.order },
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return result;
    }

    @Patch('categories/:key')
    @Roles('admin')
    async updateCategory(
        @Param('key') key: string,
        @Body() dto: UpdateArticleCategoryDto,
        @Req() req: AdminAuthenticatedRequest,
    ) {
        const result = await this.articleService.updateCategory(key, dto);
        await this.auditLogService.log({
            adminId: req.admin?.adminId,
            action: 'update_article_category',
            targetType: 'article_category',
            targetId: result.key,
            details: { key: result.key, changes: dto },
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return result;
    }

    @Delete('categories/:key')
    @Roles('admin')
    async deleteCategory(
        @Param('key') key: string,
        @Req() req: AdminAuthenticatedRequest,
        @Query('target') target?: string,
    ) {
        const result = await this.articleService.deleteCategory(key, target);
        await this.auditLogService.log({
            adminId: req.admin?.adminId,
            action: 'delete_article_category',
            targetType: 'article_category',
            targetId: key,
            details: { key, targetCategory: result.targetCategory, migrated: result.migrated },
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return result;
    }

    @Get(':id')
    @Roles('admin')
    async findOne(@Param('id') id: string) {
        return this.articleService.findOne(id);
    }

    @Post()
    @Roles('admin')
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
    @Roles('admin')
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
    @Roles('admin')
    @HttpCode(HttpStatus.OK)
    async delete(
        @Param('id') id: string,
        @Req() req: AdminAuthenticatedRequest,
    ) {
        // Get article info before deletion for audit
        const article = await this.articleService.findOne(id) as { id: string; title: string } | null;

        await this.articleService.delete(id, req.admin?.adminId);

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

    @Post('bulk-delete')
    @Roles('admin')
    async bulkDelete(
        @Body() dto: BulkDeleteArticlesDto,
        @Req() req: AdminAuthenticatedRequest,
    ) {
        const results = await Promise.allSettled(
            dto.ids.map(async (id) => {
                const existing = await this.articleService.findOne(id);
                if (!existing || (existing as { deletedAt?: Date | null }).deletedAt) {
                    throw new Error('文章不存在或已删除');
                }
                await this.articleService.delete(id, req.admin?.adminId);
                return id;
            })
        );

        const successIds: string[] = [];
        const failed: { id: string; reason: string }[] = [];

        results.forEach((result, index) => {
            const id = dto.ids[index];
            if (result.status === 'fulfilled') {
                successIds.push(id);
                return;
            }
            const reason = result.reason instanceof Error ? result.reason.message : '删除失败';
            failed.push({ id, reason });
        });

        await this.auditLogService.log({
            adminId: req.admin?.adminId,
            action: 'bulk_delete_article',
            targetType: 'article',
            details: { ids: dto.ids, successIds, failed },
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });

        return { successIds, failed };
    }

    @Patch('bulk-category')
    @Roles('admin')
    async bulkUpdateCategory(
        @Body() dto: BulkUpdateArticleCategoryDto,
        @Req() req: AdminAuthenticatedRequest,
    ) {
        const results = await Promise.allSettled(
            dto.ids.map(async (id) => {
                await this.articleService.update(id, { category: dto.category });
                return id;
            })
        );

        const successIds: string[] = [];
        const failed: { id: string; reason: string }[] = [];

        results.forEach((result, index) => {
            const id = dto.ids[index];
            if (result.status === 'fulfilled') {
                successIds.push(id);
                return;
            }
            const reason = result.reason instanceof Error ? result.reason.message : '更新失败';
            failed.push({ id, reason });
        });

        await this.auditLogService.log({
            adminId: req.admin?.adminId,
            action: 'bulk_update_article_category',
            targetType: 'article',
            details: { ids: dto.ids, category: dto.category, successIds, failed },
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });

        return { successIds, failed };
    }

    @Patch('bulk-pin')
    @Roles('admin')
    async bulkUpdatePinned(
        @Body() dto: BulkUpdateArticlePinDto,
        @Req() req: AdminAuthenticatedRequest,
    ) {
        const results = await Promise.allSettled(
            dto.ids.map(async (id) => {
                await this.articleService.update(id, { sectionPinned: dto.sectionPinned });
                return id;
            })
        );

        const successIds: string[] = [];
        const failed: { id: string; reason: string }[] = [];

        results.forEach((result, index) => {
            const id = dto.ids[index];
            if (result.status === 'fulfilled') {
                successIds.push(id);
                return;
            }
            const reason = result.reason instanceof Error ? result.reason.message : '更新失败';
            failed.push({ id, reason });
        });

        await this.auditLogService.log({
            adminId: req.admin?.adminId,
            action: 'bulk_update_article_pinned',
            targetType: 'article',
            details: { ids: dto.ids, sectionPinned: dto.sectionPinned, successIds, failed },
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });

        return { successIds, failed };
    }
}
