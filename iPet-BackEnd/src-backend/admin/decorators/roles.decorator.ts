import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type AdminRole = 'admin';

/**
 * Decorator to specify which admin roles can access an endpoint
 * @example @Roles('admin') - Only admins can access
 */
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Decorator for admin-only endpoints
 */
export const SuperAdminOnly = () => Roles('admin');
