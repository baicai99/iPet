import { Module } from '@nestjs/common';
import { HealthScheduleService } from './health-schedule.service';
import { HealthScheduleController } from './health-schedule.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [HealthScheduleController],
    providers: [HealthScheduleService],
    exports: [HealthScheduleService]
})
export class HealthScheduleModule { }
