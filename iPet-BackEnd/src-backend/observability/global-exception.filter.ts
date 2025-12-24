import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { getRequestId } from './request-context';

interface ErrorResponse {
    code: string;
    message: string;
    requestId: string;
    details?: unknown;
}

const httpStatusToCode: Record<number, string> = {
    [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
    [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
    [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
    [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
    [HttpStatus.METHOD_NOT_ALLOWED]: 'METHOD_NOT_ALLOWED',
    [HttpStatus.CONFLICT]: 'CONFLICT',
    [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
    [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
    [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
    [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
};

const getErrorCode = (status: number): string => {
    return httpStatusToCode[status] || `HTTP_${status}`;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const requestId = getRequestId() || (request as any).requestId || 'unknown';

        let status: number;
        let message: string;
        let details: unknown;
        let code: string;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const resp = exceptionResponse as Record<string, unknown>;
                message = typeof resp.message === 'string'
                    ? resp.message
                    : Array.isArray(resp.message)
                        ? (resp.message as string[]).join('; ')
                        : exception.message;

                // Include validation details if present
                if (Array.isArray(resp.message) && resp.message.length > 0) {
                    details = resp.message;
                }
            } else {
                message = exception.message;
            }

            code = getErrorCode(status);
        } else {
            // Unexpected error - log full details but return generic message
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'An unexpected error occurred';
            code = 'INTERNAL_ERROR';

            this.logger.error(
                `Unhandled exception: ${exception instanceof Error ? exception.message : String(exception)}`,
                exception instanceof Error ? exception.stack : undefined,
            );
        }

        const errorResponse: ErrorResponse = {
            code,
            message,
            requestId,
            ...(details !== undefined && { details }),
        };

        response.status(status).json(errorResponse);
    }
}
