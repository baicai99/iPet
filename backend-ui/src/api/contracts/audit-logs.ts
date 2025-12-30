/**
 * 审计日志 API 契约
 */

import getHttpClient from '../client';
import type {
    ApiResponseWithMeta,
    AuditLog,
    PaginatedData,
    PaginationParams,
} from '../types';
import type { RawPaginatedData } from '../pagination';
import { normalizePaginatedData } from '../pagination';

/**
 * 获取审计日志
 * GET /api/admin/audit-logs
 */
export async function getAuditLogs(params?: PaginationParams): Promise<PaginatedData<AuditLog>> {
    const response = await getHttpClient().get<ApiResponseWithMeta<RawPaginatedData<AuditLog>>>('/admin/audit-logs', {
        params,
    }) as unknown as ApiResponseWithMeta<RawPaginatedData<AuditLog>>;

    return normalizePaginatedData(response.data);
}
