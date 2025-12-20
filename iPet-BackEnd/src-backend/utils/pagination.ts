import { BadRequestException } from '@nestjs/common';

export type PaginationParams = {
  page?: unknown;
  limit?: unknown;
};

export type PaginationOptions = {
  defaultLimit: number;
  maxLimit: number;
};

export type PaginationResult = {
  page: number;
  limit: number;
  skip: number;
  take: number;
};

const parsePositiveInt = (value: unknown, field: string): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestException(`Invalid ${field} parameter`);
  }
  return parsed;
};

export const parsePagination = (
  params: PaginationParams,
  options: PaginationOptions,
): PaginationResult => {
  const requestedPage = parsePositiveInt(params.page, 'page');
  const requestedLimit = parsePositiveInt(params.limit, 'limit');

  const page = requestedPage ?? 1;
  const limit = Math.min(requestedLimit ?? options.defaultLimit, options.maxLimit);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
};

