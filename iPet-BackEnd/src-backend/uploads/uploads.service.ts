import { Injectable, BadRequestException } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import * as fs from 'fs';
import * as path from 'path';
import { ensureDataSubdir } from '../config/data-paths';

@Injectable()
export class UploadsService {
    private readonly uploadBaseDir = ensureDataSubdir('uploads');

    async saveFile(file: Express.Multer.File, type: string = 'common'): Promise<string> {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        // 1. Validate type (optional, but good for security to prevent arbitrary directory creation)
        const allowedTypes = ['user-avatar', 'post-image', 'video', 'file', 'temp', 'common'];
        const safeType = allowedTypes.includes(type) ? type : 'common';

        // 2. Generate Date Path: YYYY/MM/DD
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');

        const relativeDir = path.join(safeType, year, month, day);
        const absoluteDir = path.join(this.uploadBaseDir, relativeDir);

        // 3. Ensure directory exists
        if (!fs.existsSync(absoluteDir)) {
            fs.mkdirSync(absoluteDir, { recursive: true });
        }

        // 4. Generate Filename: {cuid2}_original.{ext}
        // Try to get extension from original filename, fallback to mimetype
        let ext = path.extname(file.originalname);
        if (!ext && file.mimetype) {
            // Map common mimetypes to extensions
            const mimeToExt: Record<string, string> = {
                'image/jpeg': '.jpg',
                'image/png': '.png',
                'image/gif': '.gif',
                'image/webp': '.webp',
                'image/bmp': '.bmp',
                'video/mp4': '.mp4',
                'video/webm': '.webm',
                'application/pdf': '.pdf',
            };
            ext = mimeToExt[file.mimetype] || '';
        }
        const filename = `${createId()}_original${ext}`;
        const absolutePath = path.join(absoluteDir, filename);

        // 5. Write file
        try {
            fs.writeFileSync(absolutePath, file.buffer);
        } catch (error) {
            throw new BadRequestException('Failed to save file');
        }

        // 6. Return relative path (for database storage)
        // We return the path relative to the 'uploads' root, so it can be served via static file serving
        // e.g., user-avatar/2025/12/04/ckt...jpg
        return path.join(relativeDir, filename);
    }
}
