/**
 * 通用 Zod Schema
 * @description 可复用的基础 schema 定义
 */

import { z } from 'zod';

/**
 * 分页参数 Schema
 */
export const PaginationParamsSchema = z.object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(100).optional(),
});

/**
 * 分页信息 Schema
 */
export const PaginationInfoSchema = z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
});

/**
 * 分页数据 Schema 工厂函数
 * @param itemSchema 列表项的 schema
 * @returns 分页数据 schema
 */
export function createPaginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
    return z.object({
        items: z.array(itemSchema),
        pagination: PaginationInfoSchema,
    });
}

/**
 * 日期字符串 Schema（ISO 8601 格式）
 */
export const DateStringSchema = z.string().datetime();

/**
 * 可选日期字符串 Schema
 */
export const OptionalDateStringSchema = DateStringSchema.optional();
