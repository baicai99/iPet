import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHealthScheduleDto } from './dto/create-health-schedule.dto';
import type { PaginationResult } from '../utils/pagination';

@Injectable()
export class HealthScheduleService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, dto: CreateHealthScheduleDto) {
        // Verify pet ownership
        const pet = await this.prisma.pet.findFirst({
            where: { id: dto.petId, userId, deleted: false },
        });
        if (!pet) {
            throw new NotFoundException('Pet not found or does not belong to user');
        }

        // Upsert logic: if schedule exists for this type/pet, update it.
        // Assuming we only keep one active schedule per metric type for now 
        // (implied by "Next Schedule" and specific deworming context).
        // Or we can just create a new one. Given user wants "Next Schedule", often it implies a single active target.
        // Let's create new one but maybe deactivate old ones? Or just create.
        // For simplicity and standard REST, create new. Frontend can filter by latest.
        // Actually, for "Next Schedule", it usually makes sense to have one future appointment.
        // Let's create.

        return this.prisma.healthSchedule.create({
            data: {
                petId: dto.petId,
                type: dto.type,
                date: new Date(dto.date),
                time: dto.time,
                repeat: dto.repeat,
                note: dto.note,
                isActive: true
            }
        });
    }

    async findAll(userId: string, petId: string, type: string | undefined, pagination: PaginationResult) {
        // Verify pet ownership
        const pet = await this.prisma.pet.findFirst({
            where: { id: petId, userId, deleted: false },
        });
        if (!pet) {
            throw new NotFoundException('Pet not found or does not belong to user');
        }

        const where: any = {
            petId,
            isActive: true
        };
        if (type) {
            where.type = type;
        }

        // Return sorted by date asc (nearest first)
        return this.prisma.healthSchedule.findMany({
            where,
            orderBy: { date: 'asc' },
            skip: pagination.skip,
            take: pagination.take,
        });
    }

    async remove(userId: string, id: string) {
        // Verify ownership via pet
        const schedule = await this.prisma.healthSchedule.findUnique({
            where: { id },
            include: { pet: true }
        });

        if (!schedule || schedule.pet.userId !== userId) {
            throw new NotFoundException('Schedule not found');
        }

        return this.prisma.healthSchedule.delete({
            where: { id }
        });
    }
}
