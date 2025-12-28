import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/auth';

export const useLogout = () => {
    const navigate = useNavigate();
    const { logout: authLogout } = useAuth();

    const logout = () => {
        authLogout();
        navigate('/login');
    };

    return { logout };
};
