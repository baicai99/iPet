import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, AdminRole } from './decorators/roles.decorator';
import { AdminAuthenticatedRequest } from './admin-auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles specified, allow access (endpoint-level decision)
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest<AdminAuthenticatedRequest>();
        const admin = request.admin;

        if (!admin || !admin.role) {
            throw new ForbiddenException('无权访问此资源');
        }

        // super_admin has access to everything
        if (admin.role === 'super_admin') {
            return true;
        }

        // Check if the admin's role is in the required roles
        const hasRole = requiredRoles.includes(admin.role as AdminRole);

        if (!hasRole) {
            throw new ForbiddenException('权限不足，需要更高级别管理员权限');
        }

        return true;
    }
}
