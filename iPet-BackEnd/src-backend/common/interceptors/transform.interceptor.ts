import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '../response/api-response.dto';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
        const request = context.switchToHttp().getRequest();
        const requestId = request.requestId || request.headers['x-request-id'];

        return next.handle().pipe(
            map((data) => {
                // If the response is already in API format, just add requestId
                if (data && typeof data === 'object' && 'success' in data) {
                    return {
                        ...data,
                        requestId,
                        timestamp: data.timestamp || Date.now(),
                    };
                }

                // Transform to standard format
                return {
                    success: true,
                    data,
                    requestId,
                    timestamp: Date.now(),
                };
            }),
        );
    }
}
