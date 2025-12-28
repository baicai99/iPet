export type AppErrorCode = string;

export class AppError extends Error {
    code: AppErrorCode;
    requestId?: string;
    detail?: unknown;

    constructor(code: AppErrorCode, message: string, requestId?: string, detail?: unknown) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.requestId = requestId;
        this.detail = detail;
    }
}

export const isAppError = (error: unknown): error is AppError => {
    return error instanceof AppError;
};
