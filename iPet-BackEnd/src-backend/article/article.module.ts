import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ArticleController],
    providers: [ArticleService],
    exports: [ArticleService], // Export service for use in AdminModule
})
export class ArticleModule { }
