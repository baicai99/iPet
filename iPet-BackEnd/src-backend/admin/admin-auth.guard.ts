import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AdminService, AdminJwtPayload } from './admin.service';

export interface AdminAuthenticatedRequest extends Request {
    admin?: AdminJwtPayload;
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
    constructor(private readonly adminService: AdminService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AdminAuthenticatedRequest>();
        const authorization = request.headers?.authorization || request.headers?.Authorization;

        if (!authorization || typeof authorization !== 'string') {
            throw new UnauthorizedException('Missing Authorization header');
        }

        const [type, token] = authorization.split(' ');
        if (type?.toLowerCase() !== 'bearer' || !token) {
            throw new UnauthorizedException('Invalid Authorization format');
        }

        const payload = await this.adminService.validateAdminToken(token);
        request.admin = payload;

        return true;
    }
}
