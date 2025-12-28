import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { PaginationResult } from '../utils/pagination';

export interface UserListFilter {
    search?: string;
    isGuest?: boolean;
    isBanned?: boolean;
}

@Injectable()
export class AdminUsersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
    ) { }

    async findAll(filter: UserListFilter, pagination: PaginationResult) {
        const where: any = {};

        if (filter.search) {
            where.OR = [
                { email: { contains: filter.search, mode: 'insensitive' } },
                { displayName: { contains: filter.search, mode: 'insensitive' } },
                { realName: { contains: filter.search, mode: 'insensitive' } },
            ];
        }

        if (filter.isGuest !== undefined) {
            where.isGuest = filter.isGuest;
        }

        if (filter.isBanned !== undefined) {
            where.isBanned = filter.isBanned;
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    displayName: true,
                    avatar: true,
                    isGuest: true,
                    isBanned: true,
                    bannedAt: true,
                    bannedReason: true,
                    createdAt: true,
                    lastActiveAt: true,
                    membershipLevel: true,
                    points: true,
                    isVerified: true,
                    _count: {
                        select: {
                            pets: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: pagination.skip,
                take: pagination.take,
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            items: users.map(user => ({
                ...user,
                petsCount: user._count.pets,
                _count: undefined,
            })),
            total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(total / pagination.limit),
        };
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                pets: {
                    where: { deleted: false },
                    include: {
                        _count: {
                            select: {
                                healthRecords: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        // Get health records count
        const healthRecordsCount = await this.prisma.healthRecord.count({
            where: {
                pet: { userId: id },
                deleted: false,
            },
        });

        return {
            ...user,
            healthRecordsCount,
            pets: user.pets.map(pet => ({
                id: pet.id,
                name: pet.name,
                type: pet.type,
                breed: pet.breed,
                avatar: pet.avatar,
                updatedAt: pet.updatedAt,
                healthRecordsCount: pet._count.healthRecords,
            })),
        };
    }

    async banUser(id: string, reason?: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        return this.prisma.user.update({
            where: { id },
            data: {
                isBanned: true,
                bannedAt: new Date(),
                bannedReason: reason || '违反社区规定',
            },
            select: {
                id: true,
                email: true,
                displayName: true,
                isBanned: true,
                bannedAt: true,
                bannedReason: true,
            },
        });
    }

    async unbanUser(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        return this.prisma.user.update({
            where: { id },
            data: {
                isBanned: false,
                bannedAt: null,
                bannedReason: null,
            },
            select: {
                id: true,
                email: true,
                displayName: true,
                isBanned: true,
            },
        });
    }

    async deleteUser(id: string, adminId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id, deletedAt: null },
        });

        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        // Soft delete - just mark as deleted
        return this.prisma.user.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                deletedBy: adminId,
            },
            select: {
                id: true,
                email: true,
                displayName: true,
                deletedAt: true,
            },
        });
    }

    async restoreUser(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        if (!user.deletedAt) {
            throw new NotFoundException('用户未被删除');
        }

        return this.prisma.user.update({
            where: { id },
            data: {
                deletedAt: null,
                deletedBy: null,
            },
            select: {
                id: true,
                email: true,
                displayName: true,
            },
        });
    }

    async permanentDeleteUser(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { pets: true },
        });

        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        // Delete user avatar
        if (user.avatar) {
            await this.storageService.deleteFile(user.avatar);
        }

        // Delete pet avatars
        for (const pet of user.pets) {
            if (pet.avatar) {
                await this.storageService.deleteFile(pet.avatar);
            }
        }

        // Use transaction to delete all related data
        return this.prisma.$transaction(async (tx) => {
            await tx.pet.deleteMany({ where: { userId: id } });
            await tx.userSyncState.deleteMany({ where: { userId: id } });
            return tx.user.delete({ where: { id } });
        });
    }

    async getDeletedUsers(pagination: PaginationResult) {
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where: { deletedAt: { not: null } },
                select: {
                    id: true,
                    email: true,
                    displayName: true,
                    deletedAt: true,
                    deletedBy: true,
                },
                orderBy: { deletedAt: 'desc' },
                skip: pagination.skip,
                take: pagination.take,
            }),
            this.prisma.user.count({ where: { deletedAt: { not: null } } }),
        ]);

        return {
            items: users,
            total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(total / pagination.limit),
        };
    }

    async getGuestStats() {
        const [total, last7Days, last30Days] = await Promise.all([
            this.prisma.user.count({ where: { isGuest: true, deletedAt: null } }),
            this.prisma.user.count({
                where: {
                    isGuest: true,
                    deletedAt: null,
                    guestCreatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                },
            }),
            this.prisma.user.count({
                where: {
                    isGuest: true,
                    deletedAt: null,
                    guestCreatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                },
            }),
        ]);

        return { total, last7Days, last30Days };
    }
}

