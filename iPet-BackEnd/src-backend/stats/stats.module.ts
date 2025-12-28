import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { AdminModule } from '../admin/admin.module';

@Module({
    imports: [PrismaModule, forwardRef(() => AdminModule)],
    controllers: [StatsController],
    providers: [StatsService],
    exports: [StatsService],
})
export class StatsModule { }
