import { Controller, Post, UploadedFile, UseInterceptors, Param, Req, BadRequestException, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { UploadBase64Dto } from './dto/upload-base64.dto';
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
        const url = this.buildUploadUrl(req, relativePath);

        return {
            url,
            path: relativePath // Return relative path for DB storage if needed
        };
    }

    @Post(':type/base64')
    async uploadBase64(
        @Param('type') type: string,
        @Body() body: UploadBase64Dto,
        @Req() req: Request
    ) {
        const { buffer, fileName, mimeType } = this.parseBase64Body(body);
        const relativePath = await this.uploadsService.saveBase64(buffer, type, fileName, mimeType);
        const url = this.buildUploadUrl(req, relativePath);
        return { url, path: relativePath };
    }

    private parseBase64Body(payload: UploadBase64Dto) {
        const data = payload?.data?.trim();
        if (!data) {
            throw new BadRequestException('Base64 data is required');
        }

        let base64 = data;
        let mimeType = payload.mimeType;

        const dataUrlMatch = data.match(/^data:(.+?);base64,(.+)$/);
        if (dataUrlMatch) {
            mimeType = mimeType || dataUrlMatch[1];
            base64 = dataUrlMatch[2];
        }

        const sanitized = base64.replace(/\s/g, '');
        const buffer = Buffer.from(sanitized, 'base64');
        return {
            buffer,
            fileName: payload.fileName || 'upload',
            mimeType,
        };
    }

    private buildUploadUrl(req: Request, relativePath: string) {
        const protocol = req.protocol;
        const host = req.get('host');
        return `${protocol}://${host}/api/uploads/${relativePath}`;
    }
}
