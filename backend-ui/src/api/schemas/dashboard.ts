/**
 * Dashboard 相关 Zod Schema
 * @description 仪表盘统计和趋势数据的运行时类型校验
 */

import { z } from 'zod';
import { DateStringSchema } from './common';

/**
 * 宠物分布 Schema
 */
export const PetDistributionSchema = z.object({
    type: z.enum(['dog', 'cat', 'other']),
    count: z.number().int().nonnegative(),
});

/**
 * Dashboard 统计 Schema
 */
export const DashboardStatsSchema = z.object({
    users: z.object({
        total: z.number().int().nonnegative(),
        guests: z.number().int().nonnegative(),
        registered: z.number().int().nonnegative(),
        active7d: z.number().int().nonnegative(),
        active30d: z.number().int().nonnegative(),
        newToday: z.number().int().nonnegative(),
    }),
    pets: z.object({
        total: z.number().int().nonnegative(),
        distribution: z.array(PetDistributionSchema),
    }),
    healthRecords: z.object({
        total: z.number().int().nonnegative(),
        today: z.number().int().nonnegative(),
    }),
    articles: z.object({
        total: z.number().int().nonnegative(),
        totalViews: z.number().int().nonnegative(),
    }),
    generatedAt: DateStringSchema,
});

/**
 * 趋势点 Schema
 */
export const TrendPointSchema = z.object({
    date: z.string(),  // YYYY-MM-DD 格式
    count: z.number().int().nonnegative(),
});

/**
 * 趋势数据数组 Schema
 */
export const TrendDataSchema = z.array(TrendPointSchema);
