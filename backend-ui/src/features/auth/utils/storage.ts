const TOKEN_KEY = 'auth_token';

interface TokenStorage {
    getToken: () => string | null;
    setToken: (token: string, remember?: boolean) => void;
    removeToken: () => void;
    isRemembered: () => boolean;
}

export const tokenStorage: TokenStorage = {
    getToken: () => {
        return sessionStorage.getItem(TOKEN_KEY);
    },

    setToken: (token: string, remember = false) => {
        void remember;
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.setItem(TOKEN_KEY, token);
    },

    removeToken: () => {
        sessionStorage.removeItem(TOKEN_KEY);
    },

    isRemembered: () => {
        return false;
    }
};
