/**
 * Mock Synchronization Check Script
 * 
 * Verifies that all mock handlers used in `mock/index.ts` (H5) are also registered in `mockRegistry.ts` (WeChat default).
 * This prevents the common bug where a developer adds a mock for H5 but forgets to add it for the Mini Program.
 * 
 * Usage: node scripts/check-mock-sync.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const MOCK_INDEX_PATH = path.join(ROOT_DIR, 'mock/index.ts');
const MOCK_REGISTRY_PATH = path.join(ROOT_DIR, 'src/utils/common/mockRegistry.ts');

function extractHandlersFromIndex(content) {
    // Matches: response: adapt(getHealthRecordsMock)
    const regex = /response:\s*adapt\(\s*(\w+)\s*\)/g;
    const handlers = new Set();
    let match;
    while ((match = regex.exec(content)) !== null) {
        handlers.add(match[1]);
    }
    return handlers;
}

function extractHandlersFromRegistry(content) {
    // Matches: handlerName: 'getHealthRecordsMock'
    const regex = /handlerName:\s*['"](\w+)['"]/g;
    const handlers = new Set();
    let match;
    while ((match = regex.exec(content)) !== null) {
        handlers.add(match[1]);
    }
    return handlers;
}

function main() {
    console.log('🔍 Checking Mock Synchronization...');

    if (!fs.existsSync(MOCK_INDEX_PATH)) {
        console.error(`❌ Error: ${MOCK_INDEX_PATH} not found.`);
        process.exit(1);
    }
    if (!fs.existsSync(MOCK_REGISTRY_PATH)) {
        console.error(`❌ Error: ${MOCK_REGISTRY_PATH} not found.`);
        process.exit(1);
    }

    const indexContent = fs.readFileSync(MOCK_INDEX_PATH, 'utf-8');
    const registryContent = fs.readFileSync(MOCK_REGISTRY_PATH, 'utf-8');

    const indexHandlers = extractHandlersFromIndex(indexContent);
    const registryHandlers = extractHandlersFromRegistry(registryContent);

    console.log(`- Found ${indexHandlers.size} handlers in mock/index.ts (H5)`);
    console.log(`- Found ${registryHandlers.size} handlers in mockRegistry.ts (WeChat)`);

    // Check for missing handlers in Registry (Critical for MP)
    const missingInRegistry = [...indexHandlers].filter(h => !registryHandlers.has(h));

    // Check for missing in Index (Less critical but good for cleanup)
    const missingInIndex = [...registryHandlers].filter(h => !indexHandlers.has(h));

    let hasError = false;

    if (missingInRegistry.length > 0) {
        console.error('\n❌ ERROR: The following handlers are present in H5 mocks but MISSING in WeChat mockRegistry:');
        missingInRegistry.forEach(h => console.error(`   - ${h}`));
        console.error('👉 Please add them to src/utils/common/mockRegistry.ts');
        hasError = true;
    }

    if (missingInIndex.length > 0) {
        console.warn('\n⚠️  WARNING: The following handlers are present in mockRegistry but NOT used in H5 mocks:');
        missingInIndex.forEach(h => console.warn(`   - ${h}`));
        // This is not a fatal error, just a warning
    }

    if (hasError) {
        console.error('\nFAILED: Mock definitions are out of sync.');
        process.exit(1);
    } else {
        console.log('\n✅ SUCCESS: Mock definitions are synchronized.');
        process.exit(0);
    }
}

main();
