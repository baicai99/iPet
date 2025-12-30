/**
 * Users 相关 Zod Schema
 * @description 用户、宠物、访客统计的运行时类型校验
 */

import { z } from 'zod';
import { createPaginatedSchema, DateStringSchema, OptionalDateStringSchema } from './common';

/**
 * 用户 Schema
 */
export const UserSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    displayName: z.string().min(1),
    avatar: z.string().url().optional(),
    isGuest: z.boolean(),
    isBanned: z.boolean(),
    bannedAt: OptionalDateStringSchema,
    bannedReason: z.string().optional(),
    createdAt: DateStringSchema,
    lastActiveAt: OptionalDateStringSchema,
    petsCount: z.number().int().nonnegative(),
});

/**
 * 宠物类型 Schema
 */
export const PetTypeSchema = z.enum(['dog', 'cat', 'other']);

/**
 * 宠物 Schema
 */
export const PetSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    type: PetTypeSchema,
    healthRecordsCount: z.number().int().nonnegative(),
});

/**
 * 用户详情 Schema
 */
export const UserDetailSchema = UserSchema.extend({
    healthRecordsCount: z.number().int().nonnegative(),
    pets: z.array(PetSchema),
});

/**
 * 用户列表 Schema（分页数据）
 */
export const UserListSchema = createPaginatedSchema(UserSchema);

/**
 * 访客统计 Schema
 */
export const GuestStatsSchema = z.object({
    total: z.number().int().nonnegative(),
    last7Days: z.number().int().nonnegative(),
    last30Days: z.number().int().nonnegative(),
});
