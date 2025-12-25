import { Injectable, BadRequestException } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import * as fs from 'fs';
import * as path from 'path';
import { ensureDataSubdir } from '../config/data-paths';

@Injectable()
export class UploadsService {
    private readonly uploadBaseDir = ensureDataSubdir('uploads');
    private readonly allowedTypes = ['user-avatar', 'post-image', 'video', 'file', 'temp', 'common'];
    private readonly mimeToExt: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/bmp': '.bmp',
        'video/mp4': '.mp4',
        'video/webm': '.webm',
        'application/pdf': '.pdf',
    };

    async saveFile(file: Express.Multer.File, type: string = 'common'): Promise<string> {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        return this.saveBuffer(file.buffer, file.originalname, file.mimetype, type);
    }

    async saveBase64(buffer: Buffer, type: string = 'common', originalName = 'upload', mimeType?: string): Promise<string> {
        if (!buffer || !buffer.length) {
            throw new BadRequestException('File data is required');
        }
        return this.saveBuffer(buffer, originalName, mimeType, type);
    }

    private saveBuffer(buffer: Buffer, originalName: string, mimeType: string | undefined, type: string): string {
        const safeType = this.allowedTypes.includes(type) ? type : 'common';
        const { relativeDir, absoluteDir } = this.buildDirectories(safeType);

        if (!fs.existsSync(absoluteDir)) {
            fs.mkdirSync(absoluteDir, { recursive: true });
        }

        const ext = this.resolveExtension(originalName, mimeType);
        const filename = `${createId()}_original${ext}`;
        const absolutePath = path.join(absoluteDir, filename);

        try {
            fs.writeFileSync(absolutePath, buffer);
        } catch (error) {
            throw new BadRequestException('Failed to save file');
        }

        return path.join(relativeDir, filename);
    }

    private buildDirectories(type: string): { absoluteDir: string; relativeDir: string } {
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const relativeDir = path.join(type, year, month, day);
        const absoluteDir = path.join(this.uploadBaseDir, relativeDir);
        return { absoluteDir, relativeDir };
    }

    private resolveExtension(originalName: string, mimeType?: string): string {
        const nameExt = path.extname(originalName || '');
        if (nameExt) {
            return nameExt;
        }
        if (mimeType) {
            return this.mimeToExt[mimeType] || '';
        }
        return '';
    }
}
