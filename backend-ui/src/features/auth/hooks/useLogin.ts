import { useState } from 'react';
import { useAuth } from '@/core/auth';
import { login as loginRequest } from '@/api/contracts/auth';

export interface LoginFormValues {
    username: string;
    password: string;
    remember?: boolean;
}

interface UseLoginResult {
    login: (values: LoginFormValues) => Promise<void>;
    loading: boolean;
    error: string | null;
}

export const useLogin = (onSuccess: () => void): UseLoginResult => {
    const { login: authLogin } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const login = async (values: LoginFormValues) => {
        setLoading(true);
        setError(null);

        try {
            const response = await loginRequest({
                username: values.username,
                password: values.password,
            });
            authLogin(response);
            onSuccess();
        } catch (err) {
            const messageText = err instanceof Error ? err.message : '登录失败';
            setError(messageText);
        } finally {
            setLoading(false);
        }
    };

    return { login, loading, error };
};
