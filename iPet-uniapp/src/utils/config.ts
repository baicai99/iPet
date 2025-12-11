const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';

const resolveApiBaseUrl = () => {
    const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!rawBaseUrl) {
        return DEFAULT_API_BASE_URL;
    }
    return rawBaseUrl.replace(/\/$/, '');
};

export const APP_CONFIG = {
    API_BASE_URL: resolveApiBaseUrl(),
    TIMEOUT: 10000,
    USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true',
};
