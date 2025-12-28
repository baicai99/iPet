import { useAuthContext } from './AuthContext';

/**
 * 认证 Hook
 * @description 提供快捷访问认证状态和方法
 */
export const useAuth = () => {
    return useAuthContext();
};

export default useAuth;
