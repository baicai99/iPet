import { Injectable, Logger } from '@nestjs/common';
import { unlink, access } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';
import { getDataPath } from '../config/data-paths';

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);

    /**
     * Deletes a file from the uploads directory given its public URL or filename.
     * @param fileUrlOrPath The public URL (e.g., http://host/api/uploads/file.jpg) or just the filename (file.jpg)
     */
    async deleteFile(fileUrlOrPath: string | null | undefined): Promise<void> {
        if (!fileUrlOrPath) {
            return;
        }

        try {
            // Extract filename from URL if needed
            let filename = fileUrlOrPath;
            if (fileUrlOrPath.includes('/api/uploads/')) {
                filename = fileUrlOrPath.split('/api/uploads/').pop() || '';
            }

            if (!filename) {
                return;
            }

            // Construct full path
            const filePath = getDataPath('uploads', filename);

            // Check if file exists
            try {
                await access(filePath, constants.F_OK);
            } catch (e) {
                this.logger.warn(`File not found for deletion: ${filePath}`);
                return;
            }

            // Delete file
            await unlink(filePath);
            this.logger.log(`Deleted file: ${filePath}`);
        } catch (error) {
            this.logger.error(`Failed to delete file: ${fileUrlOrPath}`, error);
            // We don't throw here to avoid blocking the main deletion flow
        }
    }
}
