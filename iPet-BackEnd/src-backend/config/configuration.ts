import { join } from 'path';
import { ensureDataSubdir, getDataRoot } from './data-paths';

const DEFAULT_CORS_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173';
const DEFAULT_CORS_ALLOWED_HEADERS = 'Content-Type,Authorization,If-None-Match,X-Request-Id,Origin,Accept,X-Requested-With';
const DEFAULT_CORS_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
const DEFAULT_CORS_EXPOSED_HEADERS = 'ETag,X-Request-Id';

const resolveJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (secret) {
    return secret;
  }

  if (nodeEnv === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production environments.');
  }

  // Development fallback only if explicitly allowed or just return undefined to fail fast if preferred.
  // User requested: "Ensure configuration.ts has no sensitive default values".
  // So we should probably throw or return undefined if not found, even in dev, or log a warning.
  // However, for dev convenience, maybe we keep a dev secret but log a warning?
  // The user said: "Force production to provide JWT_SECRET... Ensure configuration.ts has no sensitive default values."
  // So I will remove the hardcoded string entirely.
  throw new Error('JWT_SECRET environment variable is not defined.');
};

const syncDirectory = process.env.SYNC_DIR || ensureDataSubdir('sync');
const dbDirectory = ensureDataSubdir('db');
const defaultDbUrl = `file:${join(dbDirectory, 'ipet.db')}`;

const parseCsv = (value: string | undefined, fallback: string): string[] => {
  const source = value?.trim() ? value : fallback;
  return source.split(',').map(item => item.trim()).filter(Boolean);
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value?.trim()) {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  return ['true', '1', 'yes', 'on'].includes(normalized);
};

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: resolveJwtSecret(),
  bodyLimit: process.env.BODY_LIMIT || '20mb',
  syncDirectory,
  maxBackups: parseInt(process.env.SYNC_MAX_BACKUPS || '3', 10),
  cors: {
    origins: parseCsv(process.env.CORS_ORIGINS, DEFAULT_CORS_ORIGINS),
    allowedHeaders: parseCsv(process.env.CORS_ALLOWED_HEADERS, DEFAULT_CORS_ALLOWED_HEADERS),
    methods: parseCsv(process.env.CORS_METHODS, DEFAULT_CORS_METHODS),
    exposedHeaders: parseCsv(process.env.CORS_EXPOSED_HEADERS, DEFAULT_CORS_EXPOSED_HEADERS),
    credentials: parseBoolean(process.env.CORS_CREDENTIALS, true),
    optionsSuccessStatus: parseInt(process.env.CORS_OPTIONS_SUCCESS_STATUS || '204', 10),
    preflightContinue: parseBoolean(process.env.CORS_PREFLIGHT_CONTINUE, false),
  },
  databaseUrl: process.env.DATABASE_URL || defaultDbUrl,
  dataRoot: getDataRoot(),
  redisUrl: process.env.REDIS_URL,
  cache: {
    namespace: process.env.CACHE_NAMESPACE || 'ipet',
    defaultTtlMs: parseInt(process.env.CACHE_DEFAULT_TTL_MS || '60000', 10),
  },
  auth: {
    loginProtection: {
      maxFailures: parseInt(process.env.AUTH_LOGIN_MAX_FAILURES || '5', 10),
      failureWindowMs: parseInt(process.env.AUTH_LOGIN_FAIL_WINDOW_MS || String(60 * 60 * 1000), 10),
      cooldownMs: parseInt(process.env.AUTH_LOGIN_COOLDOWN_MS || String(10 * 60 * 1000), 10),
    },
  },
  observability: {
    prismaSlowQueryMs: parseInt(process.env.OBS_PRISMA_SLOW_QUERY_MS || '100', 10),
    httpMetricsMaxSamples: parseInt(process.env.OBS_HTTP_METRICS_MAX_SAMPLES || '500', 10),
    metricsToken: process.env.OBS_METRICS_TOKEN,
  },

});
