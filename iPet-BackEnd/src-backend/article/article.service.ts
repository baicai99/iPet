import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArticleService {
    constructor(private prisma: PrismaService) { }

    async findAll(category?: string) {
        const where = category && category !== 'all' ? { category } : {};
        return this.prisma.article.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.article.findUnique({
            where: { id },
        });
    }

    async create(data: { title: string; summary: string; content: string; category: string; cover?: string; author?: string }) {
        return this.prisma.article.create({
            data,
        });
    }
}
