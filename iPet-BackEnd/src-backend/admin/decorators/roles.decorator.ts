import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type AdminRole = 'admin' | 'super_admin';

/**
 * Decorator to specify which admin roles can access an endpoint
 * @example @Roles('super_admin') - Only super admins can access
 * @example @Roles('admin', 'super_admin') - Both roles can access
 */
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Decorator for super_admin only endpoints
 */
export const SuperAdminOnly = () => Roles('super_admin');
