#!/usr/bin/env node
/**
 * OpenAPI Contract Validation Script
 * 
 * Validates the OpenAPI specification for syntax correctness.
 * 用于 CI 门禁，确保契约文件格式正确。
 */

const fs = require('fs');
const path = require('path');

// Contract file path
const CONTRACT_PATH = path.join(__dirname, '..', 'docs', 'contracts', 'openapi.yaml');

async function main() {
    console.log('🔍 Validating OpenAPI contract...\n');

    // Check if contract file exists
    if (!fs.existsSync(CONTRACT_PATH)) {
        console.error('❌ Contract file not found:', CONTRACT_PATH);
        process.exit(1);
    }

    console.log('📄 Contract file:', CONTRACT_PATH);

    try {
        // Try to load swagger-parser if available
        let SwaggerParser;
        try {
            SwaggerParser = require('@apidevtools/swagger-parser');
        } catch (e) {
            // Fallback: basic YAML syntax check
            console.log('⚠️  swagger-parser not installed, performing basic validation...');

            const yaml = require('yaml');
            const content = fs.readFileSync(CONTRACT_PATH, 'utf8');
            const doc = yaml.parse(content);

            // Basic structure checks
            if (!doc.openapi) {
                throw new Error('Missing "openapi" version field');
            }
            if (!doc.info || !doc.info.title) {
                throw new Error('Missing "info.title" field');
            }
            if (!doc.paths || Object.keys(doc.paths).length === 0) {
                throw new Error('No paths defined in contract');
            }

            console.log('\n✅ Basic validation passed');
            console.log(`   - OpenAPI version: ${doc.openapi}`);
            console.log(`   - API title: ${doc.info.title}`);
            console.log(`   - Paths defined: ${Object.keys(doc.paths).length}`);

            process.exit(0);
        }

        // Full OpenAPI validation with swagger-parser
        const api = await SwaggerParser.validate(CONTRACT_PATH);

        console.log('\n✅ OpenAPI contract is valid!');
        console.log(`   - API: ${api.info.title} v${api.info.version}`);
        console.log(`   - Paths: ${Object.keys(api.paths).length}`);

        // Count operations
        let operationCount = 0;
        for (const pathItem of Object.values(api.paths)) {
            for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
                if (pathItem[method]) operationCount++;
            }
        }
        console.log(`   - Operations: ${operationCount}`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Contract validation failed:');
        console.error('   ', error.message);

        if (error.details) {
            console.error('\n   Details:');
            for (const detail of error.details) {
                console.error('   -', detail.message);
            }
        }

        process.exit(1);
    }
}

main().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
