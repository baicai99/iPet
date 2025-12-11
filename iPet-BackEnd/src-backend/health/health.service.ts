import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHealthRecordDto } from './dto/create-health-record.dto';
import { UpdateHealthRecordDto } from './dto/update-health-record.dto';
import { v4 as uuidv4 } from 'uuid';
import { HealthRecord } from '@shared/types/health';

@Injectable()
export class HealthService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async create(userId: string, createHealthRecordDto: CreateHealthRecordDto) {
        // Verify pet ownership
        const pet = await this.prisma.pet.findFirst({
            where: { id: createHealthRecordDto.petId, userId, deleted: false },
        });
        if (!pet) {
            throw new NotFoundException('Pet not found or does not belong to user');
        }

        const result = await this.prisma.healthRecord.create({
            data: {
                id: uuidv4(),
                ...createHealthRecordDto,
            },
        });



        return result;
    }

    async findAll(userId: string, petId?: string, page?: number, limit?: number, type?: string): Promise<HealthRecord[]> {
        const where: any = {
            pet: { userId },
            deleted: false,
        };
        if (petId) {
            where.petId = petId;
        }
        if (type) {
            where.type = type;
        }

        const query: any = {
            where,
            orderBy: { date: 'desc' },
        };

        if (page && limit) {
            const p = Number(page);
            const l = Number(limit);
            if (!isNaN(p) && !isNaN(l) && p > 0 && l > 0) {
                query.skip = (p - 1) * l;
                query.take = l;
            }
        }

        const records = await this.prisma.healthRecord.findMany(query);
        return records.map(record => ({
            ...record,
            updatedAt: record.updatedAt.getTime(),
            metadata: (record.metadata || undefined) as Record<string, any> | undefined,
        }));
    }

    async getSummary(userId: string, petId: string) {
        // Verify pet ownership
        const pet = await this.prisma.pet.findFirst({
            where: { id: petId, userId, deleted: false },
        });
        if (!pet) {
            throw new NotFoundException('Pet not found or does not belong to user');
        }

        // 1. Pinned Metrics
        // Fetch pinned metrics for this pet
        const pinnedRecords = await this.prisma.pinnedMetric.findMany({
            where: { petId },
        });

        let pinnedKeys = pinnedRecords.map(p => p.metricKey);

        // Removed default pins logic to allow empty state

        const pinnedMetrics: any[] = [];

        for (const key of pinnedKeys) {
            const latestRecord = await this.prisma.healthRecord.findFirst({
                where: {
                    petId,
                    type: key,
                    deleted: false,
                },
                orderBy: {
                    date: 'desc',
                },
                take: 50,
            });

            // Calculate trend
            const recentRecords = await this.prisma.healthRecord.findMany({
                where: {
                    petId,
                    type: key,
                    deleted: false,
                },
                orderBy: {
                    date: 'desc',
                },
                take: 10,
            });

            let trend = 'flat';
            let trendValue = '0';

            if (recentRecords.length >= 2) {
                const latest = Number(recentRecords[0].value);
                const previous = Number(recentRecords[1].value);
                const diff = latest - previous;
                if (diff > 0) {
                    trend = 'up';
                    trendValue = `+${diff.toFixed(1)}`;
                } else if (diff < 0) {
                    trend = 'down';
                    trendValue = `${diff.toFixed(1)}`;
                }
            }

            pinnedMetrics.push({
                key,
                latestRecord,
                trend,
                trendValue,
                history: recentRecords
            });
        }

        // 2. Trends (Walk, Meal)
        // For simplicity, we will just return the raw series data for now and let frontend do some formatting if needed, 
        // OR we can do the aggregation here. 
        // Let's return the raw series for the last 7 days for these specific metrics.
        const trendKeys = ['weight', 'water', 'sleep_duration', 'walk_duration', 'meal'];
        const trends: any[] = [];

        for (const key of trendKeys) {
            const records = await this.prisma.healthRecord.findMany({
                where: {
                    petId,
                    type: key,
                    deleted: false,
                },
                orderBy: {
                    date: 'desc',
                },
                take: 30, // Last 30 records
            });
            trends.push({
                key,
                records
            });
        }

        const result = {
            pinnedMetrics,
            trends,
            dailySummaries: {}
        };

        // 3. Daily Summaries (Today's Total)
        // Calculate sum for specific metrics for today (server time for now, or we can accept a date param)
        const summableMetrics = ['meal', 'water', 'walk_duration'];
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        for (const key of summableMetrics) {
            const todayRecords = await this.prisma.healthRecord.findMany({
                where: {
                    petId,
                    type: key,
                    deleted: false,
                    date: {
                        gte: todayStart.toISOString()
                    }
                }
            });

            const sum = todayRecords.reduce((acc, curr) => acc + curr.value, 0);
            result.dailySummaries[key] = sum;
        }

        return result;
    }

    async findOne(id: string, userId: string): Promise<HealthRecord> {
        const record = await this.prisma.healthRecord.findFirst({
            where: { id, pet: { userId }, deleted: false },
        });
        if (!record) {
            throw new NotFoundException(`Health record with ID ${id} not found`);
        }
        return {
            ...record,
            updatedAt: record.updatedAt.getTime(),
            metadata: (record.metadata || undefined) as Record<string, any> | undefined,
        };
    }

    async update(id: string, userId: string, updateHealthRecordDto: UpdateHealthRecordDto) {
        const record = await this.findOne(id, userId);

        const result = await this.prisma.healthRecord.update({
            where: { id },
            data: updateHealthRecordDto,
        });

        return result;
    }

    async remove(id: string, userId: string) {
        const record = await this.findOne(id, userId);

        const result = await this.prisma.healthRecord.update({
            where: { id },
            data: { deleted: true },
        });

        return result;
    }

    async toggleMetricPin(userId: string, petId: string, metricKey: string, isPinned: boolean) {
        // Verify pet ownership
        const pet = await this.prisma.pet.findFirst({
            where: { id: petId, userId, deleted: false },
        });
        if (!pet) {
            throw new NotFoundException('Pet not found or does not belong to user');
        }

        if (isPinned) {
            // Create pin if not exists
            // Use upsert or create with catch to handle duplicates safely, or findFirst then create
            const existing = await this.prisma.pinnedMetric.findUnique({
                where: {
                    petId_metricKey: {
                        petId,
                        metricKey
                    }
                }
            });
            if (!existing) {
                await this.prisma.pinnedMetric.create({
                    data: {
                        petId,
                        metricKey
                    }
                });
            }
        } else {
            // Remove pin
            await this.prisma.pinnedMetric.deleteMany({
                where: {
                    petId,
                    metricKey
                }
            });
        }

        return { success: true };
    }
}
