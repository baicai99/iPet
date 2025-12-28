#!/usr/bin/env node
/**
 * Prisma Auto-Sync Script
 * 
 * 检查 Prisma 客户端和数据库迁移状态，必要时自动同步：
 * 1. 检查 Prisma 客户端是否需要重新生成
 * 2. 检查数据库迁移是否是最新的
 * 3. 如果不是最新，自动执行同步
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PRISMA_DIR = path.join(__dirname, '..', 'prisma');
const SCHEMA_PATH = path.join(PRISMA_DIR, 'schema.prisma');
const CACHE_FILE = path.join(__dirname, '.prisma-hash');
const NODE_MODULES_PRISMA = path.join(__dirname, '..', 'node_modules', '@prisma', 'client');

// 颜色输出
const colors = {
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
};

function log(emoji, message) {
    console.log(`${emoji} ${message}`);
}

function getSchemaHash() {
    try {
        const content = fs.readFileSync(SCHEMA_PATH, 'utf8');
        return crypto.createHash('md5').update(content).digest('hex');
    } catch {
        return null;
    }
}

function getCachedHash() {
    try {
        return fs.readFileSync(CACHE_FILE, 'utf8').trim();
    } catch {
        return null;
    }
}

function saveCachedHash(hash) {
    fs.writeFileSync(CACHE_FILE, hash);
}

function isPrismaClientGenerated() {
    return fs.existsSync(path.join(NODE_MODULES_PRISMA, 'index.js'));
}

function checkMigrationStatus() {
    try {
        const result = spawnSync('npx', ['prisma', 'migrate', 'status'], {
            cwd: path.join(__dirname, '..'),
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        const output = result.stdout + result.stderr;

        // 检查是否有待应用的迁移
        if (output.includes('Following migration have not yet been applied')) {
            return 'pending';
        }
        if (output.includes('Database schema is up to date')) {
            return 'up-to-date';
        }
        if (output.includes('drift')) {
            return 'drift';
        }

        return 'unknown';
    } catch {
        return 'error';
    }
}

function runPrismaGenerate() {
    log('🔄', colors.cyan('Generating Prisma Client...'));
    try {
        execSync('npx prisma generate', {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit',
        });
        log('✅', colors.green('Prisma Client generated successfully'));
        return true;
    } catch (error) {
        log('❌', colors.red('Failed to generate Prisma Client'));
        return false;
    }
}

function runMigrateDev() {
    log('🔄', colors.cyan('Applying database migrations...'));
    try {
        execSync('npx prisma migrate dev --skip-generate', {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit',
        });
        log('✅', colors.green('Database migrations applied successfully'));
        return true;
    } catch (error) {
        log('❌', colors.red('Failed to apply migrations'));
        return false;
    }
}

async function main() {
    log('🔍', colors.cyan('Checking Prisma and Database status...'));

    const currentHash = getSchemaHash();
    const cachedHash = getCachedHash();
    const clientExists = isPrismaClientGenerated();

    let needsGenerate = false;
    let needsMigrate = false;

    // 检查 Prisma 客户端
    if (!clientExists) {
        log('⚠️', colors.yellow('Prisma Client not found'));
        needsGenerate = true;
    } else if (currentHash !== cachedHash) {
        log('⚠️', colors.yellow('Schema changed since last generation'));
        needsGenerate = true;
    } else {
        log('✅', colors.green('Prisma Client is up to date'));
    }

    // 检查数据库迁移状态
    const migrationStatus = checkMigrationStatus();

    switch (migrationStatus) {
        case 'up-to-date':
            log('✅', colors.green('Database schema is up to date'));
            break;
        case 'pending':
            log('⚠️', colors.yellow('Pending migrations detected'));
            needsMigrate = true;
            break;
        case 'drift':
            log('⚠️', colors.yellow('Database drift detected'));
            needsMigrate = true;
            break;
        default:
            log('⚠️', colors.yellow('Could not determine migration status'));
    }

    // 执行必要的同步操作
    if (needsMigrate) {
        if (!runMigrateDev()) {
            process.exit(1);
        }
        needsGenerate = true; // 迁移后需要重新生成
    }

    if (needsGenerate) {
        if (!runPrismaGenerate()) {
            process.exit(1);
        }
        saveCachedHash(currentHash);
    }

    if (!needsGenerate && !needsMigrate) {
        log('🚀', colors.green('Everything is up to date!'));
    }

    log('✅', colors.green('Prisma sync check completed'));
}

main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});
