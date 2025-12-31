import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { StorageService } from '../storage/storage.service';
import { v4 as uuidv4 } from 'uuid';
import type { Pet } from '../types/pet';
import type { PaginationResult } from '../utils/pagination';

@Injectable()
export class PetsService {
    constructor(
        private prisma: PrismaService,
        private storageService: StorageService
    ) { }

    async create(userId: string, createPetDto: CreatePetDto) {
        const {
            id,
            name,
            type,
            breed,
            age,
            weight,
            gender,
            avatar,
            birthday,
            arrivalDate,
            personality,
            isSterilized,
            chipId,
            toys,
            allergens,
            vaccineDate,
            description,
        } = createPetDto;
        return this.prisma.pet.create({
            data: {
                id: id || uuidv4(),
                userId,
                name,
                type,
                breed,
                age,
                weight,
                gender,
                avatar,
                birthday,
                arrivalDate,
                isSterilized,
                chipId,
                toys,
                allergens,
                vaccineDate,
                description,
                personality: personality ? JSON.stringify(personality) : undefined,
                pinnedMetrics: {
                    create: [
                        { metricKey: 'weight' },
                        { metricKey: 'shoulder_height' },
                        { metricKey: 'meal' },
                        { metricKey: 'water' },
                    ]
                }
            },
        });
    }

    async findAll(userId: string, pagination: PaginationResult): Promise<Pet[]> {
        const pets = await this.prisma.pet.findMany({
            where: { userId, deleted: false },
            orderBy: { updatedAt: 'desc' },
            skip: pagination.skip,
            take: pagination.take,
        });
        return pets.map(pet => ({
            ...pet,
            updatedAt: pet.updatedAt.getTime(),
            personality: pet.personality ? JSON.parse(pet.personality) : [],
            type: pet.type as any,
            gender: pet.gender as 'male' | 'female' | null,
        }));
    }

    async findOne(id: string, userId: string): Promise<Pet> {
        const pet = await this.prisma.pet.findFirst({
            where: { id, userId, deleted: false },
        });
        if (!pet) {
            throw new NotFoundException(`Pet with ID ${id} not found`);
        }
        return {
            ...pet,
            updatedAt: pet.updatedAt.getTime(),
            personality: pet.personality ? JSON.parse(pet.personality) : [],
            type: pet.type as any,
            gender: pet.gender as 'male' | 'female' | null,
        };
    }

    async update(id: string, userId: string, updatePetDto: UpdatePetDto) {
        // Ensure pet exists and belongs to user
        const currentPet = await this.findOne(id, userId);

        // Delete old avatar if updating
        if (updatePetDto.avatar && currentPet.avatar && currentPet.avatar !== updatePetDto.avatar) {
            await this.storageService.deleteFile(currentPet.avatar);
        }

        const {
            name,
            type,
            breed,
            age,
            weight,
            gender,
            avatar,
            birthday,
            arrivalDate,
            personality,
            isSterilized,
            chipId,
            toys,
            allergens,
            vaccineDate,
            description,
        } = updatePetDto;
        return this.prisma.pet.update({
            where: { id },
            data: {
                name,
                type,
                breed,
                age,
                weight,
                gender,
                avatar,
                birthday,
                arrivalDate,
                isSterilized,
                chipId,
                toys,
                allergens,
                vaccineDate,
                description,
                personality: personality ? JSON.stringify(personality) : undefined,
            },
        });
    }

    async remove(id: string, userId: string) {
        // Ensure pet exists and belongs to user
        const pet = await this.findOne(id, userId);

        // Delete avatar if exists
        if (pet.avatar) {
            await this.storageService.deleteFile(pet.avatar);
        }

        // Hard delete
        return this.prisma.pet.delete({
            where: { id },
        });
    }
}
