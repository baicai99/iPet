import { Module } from '@nestjs/common';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
    imports: [PrismaModule, StorageModule],
    controllers: [PetsController],
    providers: [PetsService],
})
export class PetsModule { }
