import { existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import 'dotenv/config';

const ensureDirectory = (dirPath: string): void => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
};

const resolveDefaultDataRoot = (): string => {
  const configured = process.env.IPET_DATA_DIR || process.env.DATA_DIR;
  console.log('DEBUG: process.cwd() =', process.cwd());
  console.log('DEBUG: IPET_DATA_DIR =', process.env.IPET_DATA_DIR);
  console.log('DEBUG: DATA_DIR =', process.env.DATA_DIR);

  if (configured) {
    const resolved = resolve(configured);
    console.log('DEBUG: Resolved configured path =', resolved);
    ensureDirectory(resolved);
    return resolved;
  }

  // Fallback: resolve relative to this file's location to find project root
  // This file is located at <root>/src-backend/config/data-paths.ts or <root>/dist/config/data-paths.js
  // In both cases, going up 2 levels from __dirname gets us to <root>
  const projectRoot = resolve(__dirname, '../../');
  const dataPath = resolve(projectRoot, 'iPetData');

  console.log('DEBUG: Resolved project root via __dirname =', projectRoot);
  console.log('DEBUG: Resolved data path =', dataPath);

  ensureDirectory(dataPath);
  return dataPath;
};

let dataRoot: string | undefined;

export const getDataRoot = (): string => {
  if (!dataRoot) {
    dataRoot = resolveDefaultDataRoot();
  }
  return dataRoot;
};

export const getDataPath = (...segments: string[]): string => {
  return join(getDataRoot(), ...segments);
};

export const ensureDataSubdir = (...segments: string[]): string => {
  const dir = getDataPath(...segments);
  ensureDirectory(dir);
  return dir;
};
