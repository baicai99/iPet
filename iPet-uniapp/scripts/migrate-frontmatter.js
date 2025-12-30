#!/usr/bin/env node

/**
 * 批量添加 Frontmatter 脚本
 * 
 * 功能：为所有 .md 文件批量添加 frontmatter
 * 
 * 使用：node scripts/migrate-frontmatter.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, '../../articles-source/md');

// 文章元数据映射
const ARTICLES_METADATA = {
    anxiety: {
        title: '狗狗焦虑症：识别与缓解',
        summary: '了解焦虑的表现和原因，帮助狗狗建立安全感。',
        cover: '/static/images/articles/anxiety.png',
        category: 'education',
        tags: ['anxiety', 'mental_health', 'behavior', 'wellness'],
        updateTime: '2025-03-20'
    },
    bathing: {
        title: '狗狗洗澡完全手册',
        summary: '洗澡频率、水温控制、洗护用品选择，一文掌握洗澡全流程。',
        cover: '/static/images/articles/bathing.png',
        category: 'education',
        tags: ['bathing', 'grooming', 'hygiene', 'care'],
        updateTime: '2025-04-28'
    },
    bmi: {
        title: '狗狗BMI指数：快速评估体型',
        summary: '了解宠物BMI的计算方法和意义，科学评估体型。',
        cover: '/static/images/articles/bmi.png',
        category: 'education',
        tags: ['bmi', 'weight', 'health', 'assessment'],
        updateTime: '2025-04-16'
    },
    body_fat: {
        title: '狗狗体脂率管理：健康体态的秘密',
        summary: '体脂率比体重更能反映真实健康状况，学会科学管理。',
        cover: '/static/images/articles/body-fat.png',
        category: 'education',
        tags: ['body_fat', 'weight', 'health', 'fitness'],
        updateTime: '2025-04-18'
    },
    body_temp: {
        title: '狗狗体温监测：及时发现健康异常',
        summary: '体温是重要的健康指标，学会正确测量和判断异常体温。',
        cover: '/static/images/articles/body-temp.png',
        category: 'education',
        tags: ['body_temp', 'health', 'vital_signs', 'monitoring'],
        updateTime: '2025-04-20'
    },
    calcium: {
        title: '钙质补充：骨骼健康的基础',
        summary: '了解钙的重要性和正确补充方法，避免过量风险。',
        cover: '/static/images/articles/calcium.png',
        category: 'education',
        tags: ['calcium', 'supplement', 'bone_health', 'nutrition'],
        updateTime: '2025-03-14'
    },
    carb: {
        title: '碳水化合物：能量来源的平衡之道',
        summary: '合理摄入碳水化合物，为狗狗提供充足能量。',
        cover: '/static/images/articles/carb.png',
        category: 'education',
        tags: ['carb', 'nutrition', 'energy', 'diet'],
        updateTime: '2025-04-06'
    },
    depression: {
        title: '狗狗抑郁症：别让毛孩心情低落',
        summary: '识别抑郁信号，采取措施改善狗狗情绪。',
        cover: '/static/images/articles/depression.png',
        category: 'education',
        tags: ['depression', 'mental_health', 'behavior', 'wellness'],
        updateTime: '2025-03-18'
    },
    diet_energy: {
        title: '膳食能量管理：热量平衡的艺术',
        summary: '了解狗狗的能量需求，实现摄入与消耗的平衡。',
        cover: '/static/images/articles/diet_energy.png',
        category: 'education',
        tags: ['diet_energy', 'nutrition', 'weight', 'health'],
        updateTime: '2025-04-02'
    },
    fat: {
        title: '脂肪营养：必需但需适量',
        summary: '脂肪提供能量和必需脂肪酸，但过量会导致肥胖。',
        cover: '/static/images/articles/fat.png',
        category: 'education',
        tags: ['fat', 'nutrition', 'diet', 'health'],
        updateTime: '2025-04-04'
    },
    fiber: {
        title: '膳食纤维：肠道健康的守护者',
        summary: '适量纤维促进消化，了解来源和推荐摄入量。',
        cover: '/static/images/articles/fiber.png',
        category: 'education',
        tags: ['fiber', 'nutrition', 'digestion', 'health'],
        updateTime: '2025-03-12'
    },
    fish_oil: {
        title: '鱼油补充：Omega-3的神奇功效',
        summary: '鱼油富含Omega-3脂肪酸，对皮肤、关节和心脏都有益处。',
        cover: '/static/images/articles/fish_oil.png',
        category: 'education',
        tags: ['fish_oil', 'supplement', 'nutrition', 'health'],
        updateTime: '2025-03-16'
    },
    fitness_training: {
        title: '狗狗体能训练：打造强健体魄',
        summary: '系统的体能训练计划，提升狗狗整体运动能力。',
        cover: '/static/images/articles/fitness_training.png',
        category: 'education',
        tags: ['fitness_training', 'exercise', 'training', 'health'],
        updateTime: '2025-03-26'
    },
    lean_mass: {
        title: '去脂体重：肌肉质量的关键指标',
        summary: '去脂体重反映肌肉和骨骼质量，是评估健康的重要参数。',
        cover: '/static/images/articles/lean-mass.png',
        category: 'education',
        tags: ['lean_mass', 'muscle', 'fitness', 'health'],
        updateTime: '2025-04-14'
    },
    protein: {
        title: '蛋白质营养：肌肉和免疫的基石',
        summary: '蛋白质是狗狗最重要的营养素，了解需求量和优质来源。',
        cover: '/static/images/articles/protein.png',
        category: 'education',
        tags: ['protein', 'nutrition', 'diet', 'health'],
        updateTime: '2025-04-08'
    },
    rabies_vaccine: {
        title: '疫苗接种指南：科学免疫，安心养宠',
        summary: '了解狗狗必须接种的疫苗类型、时间节点和注意事项。',
        cover: '/static/images/articles/vaccination.png',
        category: 'education',
        tags: ['rabies_vaccine', 'vaccine', 'health', 'prevention', 'medication'],
        updateTime: '2025-05-04',
        metricKey: 'rabies_vaccine'
    },
    run_distance: {
        title: '狗狗跑步训练：循序渐进的耐力提升',
        summary: '科学规划跑步距离，避免运动损伤。',
        cover: '/static/images/articles/run_distance.png',
        category: 'education',
        tags: ['run_distance', 'exercise', 'training', 'fitness'],
        updateTime: '2025-03-30'
    },
    run_pace: {
        title: '跑步配速控制：找到最佳运动强度',
        summary: '合理控制配速，提升训练效果，预防过度疲劳。',
        cover: '/static/images/articles/run_pace.png',
        category: 'education',
        tags: ['run_pace', 'exercise', 'training', 'fitness'],
        updateTime: '2025-03-28'
    },
    shoulder_height: {
        title: '狗狗肩高测量与生长发育指南',
        summary: '肩高是评估狗狗体型和发育的重要指标，了解正确测量方法。',
        cover: '/static/images/articles/shoulder-height.png',
        category: 'education',
        tags: ['shoulder_height', 'measurement', 'growth', 'health'],
        updateTime: '2025-04-22'
    },
    stool: {
        title: '狗狗排便健康：消化系统的晴雨表',
        summary: '通过观察排便情况，及时发现消化系统问题。',
        cover: '/static/images/articles/stool.png',
        category: 'education',
        tags: ['stool', 'digestion', 'health', 'monitoring'],
        updateTime: '2025-03-22'
    },
    training: {
        title: '狗狗训练指南：培养良好行为习惯',
        summary: '系统的训练方法，让狗狗更听话、更快乐。',
        cover: '/static/images/articles/training.png',
        category: 'education',
        tags: ['training', 'behavior', 'education', 'obedience'],
        updateTime: '2025-03-24'
    },
    vomiting: {
        title: '狗狗呕吐：原因分析与应对',
        summary: '了解呕吐的常见原因，判断何时需要就医。',
        cover: '/static/images/articles/vomiting.png',
        category: 'education',
        tags: ['vomiting', 'health', 'digestion', 'emergency'],
        updateTime: '2025-03-10'
    },
    waist: {
        title: '狗狗腰围测量：脂肪分布的晴雨表',
        summary: '腰围变化能及时反映脂肪堆积情况，预防肥胖。',
        cover: '/static/images/articles/waist.png',
        category: 'education',
        tags: ['waist', 'weight', 'measurement', 'health'],
        updateTime: '2025-04-12'
    },
    water: {
        title: '狗狗饮水管理：生命之源不可忽视',
        summary: '充足饮水对健康至关重要，了解正确的饮水量和注意事项。',
        cover: '/static/images/articles/water.png',
        category: 'education',
        tags: ['water', 'hydration', 'health', 'nutrition'],
        updateTime: '2025-04-10'
    }
};

/**
 * 生成 YAML frontmatter
 */
function generateFrontmatter(id, meta) {
    const tags = meta.tags.map(t => `  - ${t}`).join('\n');
    const metricKeyLine = meta.metricKey ? `metricKey: ${meta.metricKey}\n` : '';

    return `---
id: ${id}
title: ${meta.title}
summary: ${meta.summary}
cover: ${meta.cover}
category: ${meta.category}
author: iPet 健康团队
tags:
${tags}
updateTime: ${meta.updateTime}
${metricKeyLine}source: local
---

`;
}

/**
 * 批量处理文件
 */
function migrateAllArticles() {
    console.log('\n📝 Migrating frontmatter for all articles...\n');

    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
    let processedCount = 0;
    let skippedCount = 0;

    files.forEach(file => {
        const id = path.basename(file, '.md');
        const filePath = path.join(CONTENT_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // 检查是否已有 frontmatter
        if (content.trim().startsWith('---')) {
            console.log(`⏭️  ${file}: Already has frontmatter, skipping...`);
            skippedCount++;
            return;
        }

        // 获取元数据
        const meta = ARTICLES_METADATA[id];
        if (!meta) {
            console.warn(`⚠️  ${file}: No metadata found, skipping...`);
            skippedCount++;
            return;
        }

        // 生成新内容
        const frontmatter = generateFrontmatter(id, meta);
        const newContent = frontmatter + content;

        // 写回文件
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`✅ ${file}`);
        processedCount++;
    });

    console.log('\n📊 Migration Summary:');
    console.log('─'.repeat(50));
    console.log(`  Total files:        ${files.length}`);
    console.log(`  Processed:          ${processedCount}`);
    console.log(`  Skipped:            ${skippedCount}`);
    console.log('─'.repeat(50));
    console.log('\n✨ Migration completed!\n');
}

// 执行迁移
try {
    migrateAllArticles();
} catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
}
