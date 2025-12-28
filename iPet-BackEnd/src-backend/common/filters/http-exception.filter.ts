import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ErrorCodes } from '../errors/error-codes';
import type { ApiResponse } from '../response/api-response.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let errorCode: string = ErrorCodes.INTERNAL_ERROR;
        let message = '服务器内部错误';
        let details: Record<string, any> | undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const resp = exceptionResponse as any;
                message = resp.message || exception.message;

                // Handle validation errors from class-validator
                if (Array.isArray(resp.message)) {
                    message = resp.message[0];
                    details = { errors: resp.message };
                }
            }

            // Map HTTP status to error codes
            errorCode = this.statusToErrorCode(status, exception);
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        const errorResponse: ApiResponse<null> = {
            success: false,
            error: {
                code: errorCode,
                message,
                details,
            },
            requestId: (request as any).requestId || request.headers['x-request-id'] as string,
            timestamp: Date.now(),
        };

        // Log errors for debugging
        if (status >= 500) {
            console.error(`[${errorResponse.requestId}] ${status} ${errorCode}:`, exception);
        }

        response.status(status).json(errorResponse);
    }

    private statusToErrorCode(status: number, exception: HttpException): string {
        // Check if the exception message contains specific keywords
        const message = exception.message.toLowerCase();

        if (status === 400) {
            if (message.includes('validation') || message.includes('验证')) {
                return ErrorCodes.VALIDATION_ERROR;
            }
            return ErrorCodes.INVALID_PARAMETER;
        }

        if (status === 401) {
            if (message.includes('expired') || message.includes('过期')) {
                return ErrorCodes.AUTH_TOKEN_EXPIRED;
            }
            if (message.includes('invalid') || message.includes('无效')) {
                return ErrorCodes.AUTH_TOKEN_INVALID;
            }
            return ErrorCodes.AUTH_INVALID_CREDENTIALS;
        }

        if (status === 403) {
            if (message.includes('banned') || message.includes('封禁')) {
                return ErrorCodes.USER_BANNED;
            }
            if (message.includes('disabled') || message.includes('禁用')) {
                return ErrorCodes.AUTH_ACCOUNT_DISABLED;
            }
            return ErrorCodes.ADMIN_PERMISSION_DENIED;
        }

        if (status === 404) {
            if (message.includes('user') || message.includes('用户')) {
                return ErrorCodes.USER_NOT_FOUND;
            }
            if (message.includes('pet') || message.includes('宠物')) {
                return ErrorCodes.PET_NOT_FOUND;
            }
            if (message.includes('article') || message.includes('文章')) {
                return ErrorCodes.ARTICLE_NOT_FOUND;
            }
            if (message.includes('admin') || message.includes('管理员')) {
                return ErrorCodes.ADMIN_NOT_FOUND;
            }
            return ErrorCodes.USER_NOT_FOUND; // Default 404
        }

        if (status === 409) {
            return ErrorCodes.USER_ALREADY_EXISTS;
        }

        if (status === 429) {
            return ErrorCodes.RATE_LIMIT_EXCEEDED;
        }

        if (status >= 500) {
            return ErrorCodes.INTERNAL_ERROR;
        }

        return ErrorCodes.INTERNAL_ERROR;
    }
}
