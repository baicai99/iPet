import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './decorators/roles.decorator';
import { SystemHealthService } from '../system-health/system-health.service';
import * as os from 'os';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

@Controller('admin/system')
@UseGuards(AdminAuthGuard, RolesGuard)
export class AdminSystemController {
    constructor(
        private readonly systemHealthService: SystemHealthService,
        private readonly configService: ConfigService,
    ) { }

    @Get('info')
    @Roles('admin')
    async getSystemInfo() {
        const healthInfo = this.systemHealthService.getHealthInfo();

        return {
            ...healthInfo,
            system: {
                platform: os.platform(),
                arch: os.arch(),
                nodeVersion: process.version,
                // Omit hostname for security
                uptime: process.uptime(),
                memoryUsage: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: os.totalmem() - os.freemem(),
                    usedPercent: (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(2),
                },
                cpuUsage: os.loadavg(),
            },
        };
    }

    @Get('storage')
    @Roles('admin')
    async getStorageStats() {
        const dataRoot = this.configService.get<string>('dataRoot', './data');
        const uploadsDir = `${dataRoot}/uploads`;

        const storageStats = {
            totalFiles: 0,
            totalSize: 0,
            breakdown: {} as Record<string, { count: number; size: number }>,
        };

        try {
            if (fs.existsSync(uploadsDir)) {
                const files = fs.readdirSync(uploadsDir, { withFileTypes: true });

                for (const file of files) {
                    if (file.isFile()) {
                        const filePath = `${uploadsDir}/${file.name}`;
                        const stats = fs.statSync(filePath);
                        const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';

                        storageStats.totalFiles++;
                        storageStats.totalSize += stats.size;

                        if (!storageStats.breakdown[ext]) {
                            storageStats.breakdown[ext] = { count: 0, size: 0 };
                        }
                        storageStats.breakdown[ext].count++;
                        storageStats.breakdown[ext].size += stats.size;
                    } else if (file.isDirectory()) {
                        const subDirStats = this.countDirStats(`${uploadsDir}/${file.name}`);
                        storageStats.totalFiles += subDirStats.count;
                        storageStats.totalSize += subDirStats.size;
                    }
                }
            }
        } catch (error) {
            console.error('Error reading storage stats:', error);
        }

        return {
            ...storageStats,
            totalSizeFormatted: this.formatBytes(storageStats.totalSize),
        };
    }

    private countDirStats(dirPath: string): { count: number; size: number } {
        let count = 0;
        let size = 0;

        try {
            const files = fs.readdirSync(dirPath, { withFileTypes: true });
            for (const file of files) {
                const filePath = `${dirPath}/${file.name}`;
                if (file.isFile()) {
                    const stats = fs.statSync(filePath);
                    count++;
                    size += stats.size;
                } else if (file.isDirectory()) {
                    const subStats = this.countDirStats(filePath);
                    count += subStats.count;
                    size += subStats.size;
                }
            }
        } catch {
            // Ignore errors
        }

        return { count, size };
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
