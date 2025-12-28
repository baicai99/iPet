import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { hasCapability, type Capability } from './permissions';

export const usePermission = () => {
    const { admin } = useAuth();

    const can = useMemo(() => {
        return (capability: Capability) => hasCapability(admin?.role, capability);
    }, [admin?.role]);

    return { can };
};
