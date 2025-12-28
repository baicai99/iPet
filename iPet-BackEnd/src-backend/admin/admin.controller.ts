import { Body, Controller, Post, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Throttle({ default: { limit: 5, ttl: 60 * 60 } }) // 5 attempts per hour (additional layer)
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: AdminLoginDto, @Req() req: any) {
        const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const userAgent = req.headers['user-agent'];
        return this.adminService.login(dto, ip, userAgent);
    }
}
