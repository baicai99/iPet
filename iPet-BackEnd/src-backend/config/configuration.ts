import { join } from 'path';
import { ensureDataSubdir, getDataRoot } from './data-paths';

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

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: resolveJwtSecret(),
  bodyLimit: process.env.BODY_LIMIT || '20mb',
  syncDirectory,
  maxBackups: parseInt(process.env.SYNC_MAX_BACKUPS || '3', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || defaultDbUrl,
  dataRoot: getDataRoot(),


});
