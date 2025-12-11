import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ArticleService } from './article.service';

@Controller('articles')
export class ArticleController {
    constructor(private readonly articleService: ArticleService) { }

    @Get()
    findAll(@Query('category') category?: string) {
        return this.articleService.findAll(category);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.articleService.findOne(id);
    }

    // Optional: Endpoint to create articles (for CMS or seeding)
    @Post()
    create(@Body() body: { title: string; summary: string; content: string; category: string; cover?: string; author?: string }) {
        return this.articleService.create(body);
    }
}
