#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const featureName = process.argv[2];

if (!featureName) {
    console.error('❌ Error: Feature name is required');
    console.log('\nUsage: npm run create-feature <feature-name>');
    console.log('Example: npm run create-feature pets\n');
    process.exit(1);
}

// 验证命名格式 (小写字母、数字、连字符)
if (!/^[a-z][a-z0-9-]*$/.test(featureName)) {
    console.error('❌ Error: Feature name must be lowercase and may contain hyphens');
    console.log('Example: user-management, audit-logs\n');
    process.exit(1);
}

const featureDir = path.join(__dirname, '../src/features', featureName);

// 检查是否已存在
if (fs.existsSync(featureDir)) {
    console.error(`❌ Error: Feature "${featureName}" already exists`);
    process.exit(1);
}

// 转换为 PascalCase (例如: user-management -> UserManagement)
function toPascalCase(str) {
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

const FeatureName = toPascalCase(featureName);

console.log(`\n🚀 Creating feature: ${featureName}\n`);

// 创建目录结构
const dirs = [
    `${featureDir}/pages`,
    `${featureDir}/components`,
    `${featureDir}/hooks`,
];

dirs.forEach(dir => {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created ${dir.replace(process.cwd(), '.')}`);
});

// 创建 index.ts
const indexContent = `/**
 * ${FeatureName} Feature
 * 
 * 导出所有公共接口
 */

// Pages
export { default as ${FeatureName}ListPage } from './pages/${FeatureName}ListPage';

// Components (按需导出)
// export { ${FeatureName}Card } from './components/${FeatureName}Card';

// Hooks (按需导出)
// export { use${FeatureName}Data } from './hooks/use${FeatureName}Data';
`;

fs.writeFileSync(`${featureDir}/index.ts`, indexContent);
console.log(`✅ Created ${featureDir.replace(process.cwd(), '.')}/index.ts`);

// 创建示例页面
const pageContent = `import React from 'react';

export default function ${FeatureName}ListPage() {
  return (
    <div>
      <h1>${FeatureName} List</h1>
      <p>TODO: Implement ${featureName} list page</p>
    </div>
  );
}
`;

fs.writeFileSync(`${featureDir}/pages/${FeatureName}ListPage.tsx`, pageContent);
console.log(`✅ Created ${featureDir.replace(process.cwd(), '.')}/pages/${FeatureName}ListPage.tsx`);

// 创建 .gitkeep 文件保留空目录
fs.writeFileSync(`${featureDir}/components/.gitkeep`, '');
fs.writeFileSync(`${featureDir}/hooks/.gitkeep`, '');

console.log(`\n✨ Feature "${featureName}" created successfully!\n`);
console.log('Next steps:');
console.log(`  1. Edit src/features/${featureName}/pages/${FeatureName}ListPage.tsx`);
console.log(`  2. Add components in src/features/${featureName}/components/`);
console.log(`  3. Add hooks in src/features/${featureName}/hooks/ (if needed)`);
console.log(`  4. Register route in src/router/routes.tsx\n`);
