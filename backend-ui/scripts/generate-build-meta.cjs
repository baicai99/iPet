#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Generating build meta...\n');

// 获取 Git 信息
function getGitInfo() {
    try {
        const commit = execSync('git rev-parse HEAD').toString().trim();
        const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
        const author = execSync('git log -1 --format=%an').toString().trim();
        const message = execSync('git log -1 --format=%s').toString().trim();
        const date = execSync('git log -1 --format=%aI').toString().trim();

        return {
            commit,
            commitShort: commit.substring(0, 7),
            branch,
            author,
            message,
            date,
        };
    } catch (error) {
        console.warn('⚠️  Git info not available (not a git repository?)');
        return {
            commit: 'unknown',
            commitShort: 'unknown',
            branch: 'unknown',
            author: 'unknown',
            message: 'unknown',
            date: new Date().toISOString(),
        };
    }
}

// 获取 package.json 版本
function getVersion() {
    const pkgPath = path.join(__dirname, '../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.version;
}

// 生成 build meta
const buildMeta = {
    version: getVersion(),
    buildTime: new Date().toISOString(),
    git: getGitInfo(),
    env: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
    },
};

// 确保 dist 目录存在
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
    console.error('❌ Error: dist/ directory not found. Run build first.');
    process.exit(1);
}

// 写入文件
const outputPath = path.join(distDir, 'build-meta.json');
fs.writeFileSync(outputPath, JSON.stringify(buildMeta, null, 2));

console.log('✅ Build meta generated successfully!\n');
console.log('📋 Build Information:');
console.log(`   Version: ${buildMeta.version}`);
console.log(`   Commit: ${buildMeta.git.commitShort} (${buildMeta.git.branch})`);
console.log(`   Author: ${buildMeta.git.author}`);
console.log(`   Message: ${buildMeta.git.message}`);
console.log(`   Build Time: ${buildMeta.buildTime}`);
console.log(`\n   File: ${outputPath}\n`);
