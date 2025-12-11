import { Controller, Post, UploadedFile, UseInterceptors, Param, Req, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import type { Request } from 'express';

@Controller('uploads')
export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) { }

    @Post(':type')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Param('type') type: string,
        @Req() req: Request
    ) {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        const relativePath = await this.uploadsService.saveFile(file, type);

        // Construct full URL for response
        const protocol = req.protocol;
        const host = req.get('host');
        // Assuming static files are served from /api/uploads
        const url = `${protocol}://${host}/api/uploads/${relativePath}`;

        return {
            url,
            path: relativePath // Return relative path for DB storage if needed
        };
    }
}
