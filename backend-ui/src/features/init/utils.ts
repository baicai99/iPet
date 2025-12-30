export const buildBaseUrl = (origin: string, port?: number): string => {
    if (!origin) return '';

    try {
        const parsed = new URL(origin);
        const shouldSetPort = port && port !== 80 && port !== 443;
        const normalizedPort = shouldSetPort ? String(port) : '';

        return `${parsed.protocol}//${parsed.hostname}${
            normalizedPort ? `:${normalizedPort}` : ''
        }`;
    } catch {
        return origin;
    }
};

export const buildLoginUrl = (
    origin: string,
    entryPath?: string,
    port?: number
): string => {
    const baseUrl = buildBaseUrl(origin, port);
    if (!baseUrl || !entryPath) return '';
    return `${baseUrl}/${entryPath}/login`;
};
