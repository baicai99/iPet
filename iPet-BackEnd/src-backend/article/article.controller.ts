import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ArticleService } from './article.service';
import { parsePagination } from '../utils/pagination';

@Controller('articles')
export class ArticleController {
    constructor(private readonly articleService: ArticleService) { }

    @Get()
    findAll(
        @Query('category') category?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const pagination = parsePagination({ page, limit }, { defaultLimit: 20, maxLimit: 100 });
        return this.articleService.findAll(category, pagination);
    }

    @Get('categories')
    getCategories() {
        return this.articleService.getCategories();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.articleService.findOneAndIncrementViews(id);
    }

    // Optional: Endpoint to create articles (for CMS or seeding)
    @Post()
    create(@Body() body: { title: string; summary: string; content: string; category: string; cover?: string; author?: string; tags: string[]; sectionPinned?: boolean; pinnedMetrics?: string[] }) {
        return this.articleService.create(body);
    }
}
