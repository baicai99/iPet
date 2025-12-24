import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

// Version info from environment or defaults
const APP_VERSION = process.env.APP_VERSION || process.env.npm_package_version || '0.0.1';
const GIT_COMMIT = process.env.GIT_COMMIT || 'unknown';
const BUILD_TIME = process.env.BUILD_TIME || new Date().toISOString();
const NODE_ENV = process.env.NODE_ENV || 'development';

const startTime = Date.now();

export interface HealthInfo {
    status: 'ok' | 'degraded';
    version: string;
    commit: string;
    buildTime: string;
    uptime: number;
}

export interface MigrationStatus {
    hasPending: boolean;
    pendingCount: number;
    appliedCount: number;
    appliedMigrations: string[];
}

export interface ReadinessInfo extends HealthInfo {
    db: 'connected' | 'disconnected';
    migrations: MigrationStatus;
}

@Injectable()
export class SystemHealthService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get basic health info (liveness)
     */
    getHealthInfo(): HealthInfo {
        return {
            status: 'ok',
            version: APP_VERSION,
            commit: GIT_COMMIT,
            buildTime: BUILD_TIME,
            uptime: Math.floor((Date.now() - startTime) / 1000),
        };
    }

    /**
     * Get migration status by comparing local migrations with DB
     */
    async getMigrationStatus(): Promise<MigrationStatus> {
        try {
            // Query applied migrations from _prisma_migrations table
            const appliedMigrations = await this.prisma.$queryRaw<
                { migration_name: string }[]
            >`SELECT migration_name FROM "_prisma_migrations" WHERE rolled_back_at IS NULL ORDER BY finished_at`;

            const appliedNames = appliedMigrations.map(m => m.migration_name);

            // Get local migrations from filesystem
            const migrationsDir = path.resolve(__dirname, '../../prisma/migrations');
            let localMigrations: string[] = [];

            if (fs.existsSync(migrationsDir)) {
                localMigrations = fs.readdirSync(migrationsDir)
                    .filter(name => {
                        const fullPath = path.join(migrationsDir, name);
                        return fs.statSync(fullPath).isDirectory() && !name.startsWith('.');
                    })
                    .sort();
            }

            // Calculate pending migrations
            const pendingMigrations = localMigrations.filter(m => !appliedNames.includes(m));

            return {
                hasPending: pendingMigrations.length > 0,
                pendingCount: pendingMigrations.length,
                appliedCount: appliedNames.length,
                appliedMigrations: appliedNames,
            };
        } catch (error) {
            // If _prisma_migrations table doesn't exist or other error
            return {
                hasPending: true,
                pendingCount: -1, // Unknown
                appliedCount: 0,
                appliedMigrations: [],
            };
        }
    }

    /**
     * Get readiness info with DB connectivity and migration status check
     */
    async getReadiness(): Promise<ReadinessInfo> {
        const health = this.getHealthInfo();

        try {
            // Simple query to check DB connectivity
            await this.prisma.$queryRaw`SELECT 1`;

            // Check migration status
            const migrations = await this.getMigrationStatus();

            return {
                ...health,
                status: migrations.hasPending ? 'degraded' : 'ok',
                db: 'connected',
                migrations,
            };
        } catch {
            return {
                ...health,
                status: 'degraded',
                db: 'disconnected',
                migrations: {
                    hasPending: true,
                    pendingCount: -1,
                    appliedCount: 0,
                    appliedMigrations: [],
                },
            };
        }
    }

    /**
     * Get version fingerprint for startup logging
     */
    static getVersionFingerprint(): {
        env: string;
        version: string;
        commit: string;
        buildTime: string;
    } {
        return {
            env: NODE_ENV,
            version: APP_VERSION,
            commit: GIT_COMMIT,
            buildTime: BUILD_TIME,
        };
    }
}

