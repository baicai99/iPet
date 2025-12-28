import { AdminRole } from '@/core/config';

export type Capability =
    | 'user:ban'
    | 'user:unban'
    | 'user:delete'
    | 'user:trash:view'
    | 'article:delete'
    | 'system:manage'
    | 'audit:read';

const ROLE_CAPABILITIES: Record<AdminRole, Capability[]> = {
    [AdminRole.ADMIN]: [
        'user:ban',
        'user:unban',
    ],
    [AdminRole.SUPER_ADMIN]: [
        'user:ban',
        'user:unban',
        'user:delete',
        'user:trash:view',
        'article:delete',
        'system:manage',
        'audit:read',
    ],
};

export const hasCapability = (role: AdminRole | undefined, capability: Capability): boolean => {
    if (!role) return false;
    return ROLE_CAPABILITIES[role]?.includes(capability) ?? false;
};
