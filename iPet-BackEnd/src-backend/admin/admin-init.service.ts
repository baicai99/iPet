import { Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { getDataPath } from '../config/data-paths';

export interface SystemInitConfig {
    accessUrl: string;
    port?: number;
    entryPath: string;
    updatedAt: string;
}

@Injectable()
export class AdminInitService {
    private readonly configPath = getDataPath('system-init.json');

    async getConfig(): Promise<SystemInitConfig> {
        try {
            const raw = await fs.readFile(this.configPath, 'utf-8');
            return JSON.parse(raw) as SystemInitConfig;
        } catch {
            throw new NotFoundException('System init config not found');
        }
    }

    async saveConfig(config: Omit<SystemInitConfig, 'updatedAt'>): Promise<SystemInitConfig> {
        const payload: SystemInitConfig = {
            ...config,
            updatedAt: new Date().toISOString(),
        };
        await fs.writeFile(this.configPath, JSON.stringify(payload, null, 2));
        return payload;
    }
}
