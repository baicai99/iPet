import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminArticlesController } from './admin-articles.controller';
import { ArticleModule } from '../article/article.module';
import { AdminSystemController } from './admin-system.controller';
import { SystemHealthModule } from '../system-health/system-health.module';
import { StorageModule } from '../storage/storage.module';
import { UsersModule } from '../users/users.module';
import { AdminLoginProtectionService } from './admin-login-protection.service';
import { AuditLogService } from './audit-log.service';
import { RolesGuard } from './roles.guard';

@Module({
    imports: [
        PrismaModule,
        ArticleModule,
        SystemHealthModule,
        StorageModule,
        UsersModule,
    ],
    controllers: [
        AdminController,
        AdminUsersController,
        AdminArticlesController,
        AdminSystemController,
    ],
    providers: [
        AdminService,
        AdminAuthGuard,
        AdminUsersService,
        AdminLoginProtectionService,
        AuditLogService,
        RolesGuard,
    ],
    exports: [AdminService, AdminAuthGuard, AuditLogService, RolesGuard],
})
export class AdminModule { }
