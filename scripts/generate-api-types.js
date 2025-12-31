#!/usr/bin/env node
/**
 * OpenAPI TypeScript Client Type Generator
 * 
 * Generates TypeScript types from the OpenAPI specification.
 * 从 OpenAPI 契约生成前端 TypeScript 类型，减少手写漂移。
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Paths
const CONTRACT_PATH = path.join(__dirname, '..', 'docs', 'contracts', 'openapi.yaml');
const OUTPUT_PATH = path.join(__dirname, '..', 'iPet-uniapp', 'src', 'types', 'api-types.ts');

async function main() {
    console.log('🔧 Generating TypeScript types from OpenAPI...\n');

    // Check if contract file exists
    if (!fs.existsSync(CONTRACT_PATH)) {
        console.error('❌ Contract file not found:', CONTRACT_PATH);
        process.exit(1);
    }

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        // Check if openapi-typescript is installed
        try {
            require.resolve('openapi-typescript');
        } catch (e) {
            console.log('📦 Installing openapi-typescript...');
            execSync('npm install -D openapi-typescript', {
                stdio: 'inherit',
                cwd: path.join(__dirname, '..')
            });
        }

        // Generate types
        console.log('📄 Input:', CONTRACT_PATH);
        console.log('📝 Output:', OUTPUT_PATH);

        execSync(`npx openapi-typescript "${CONTRACT_PATH}" -o "${OUTPUT_PATH}"`, {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });

        console.log('\n✅ TypeScript types generated successfully!');
        console.log(`   Output: ${OUTPUT_PATH}`);

        // Show file size
        const stats = fs.statSync(OUTPUT_PATH);
        console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);

    } catch (error) {
        console.error('\n❌ Type generation failed:');
        console.error('   ', error.message);
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
