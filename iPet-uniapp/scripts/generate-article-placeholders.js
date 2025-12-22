#!/usr/bin/env node

/**
 * Generate placeholder article cover images
 * This is a temporary solution until real cover images are provided
 */

const fs = require('fs');
const path = require('path');

// Required cover images from article frontmatter
const REQUIRED_COVERS = [
    'anxiety.webp',
    'bathing.webp',
    'bmi.webp',
    'body-fat.webp',
    'body-temp.webp',
    'calcium.webp',
    'carb.webp',
    'dental-care.webp',
    'depression.webp',
    'deworming.webp',
    'diet_energy.webp',
    'dog-exercise.webp',
    'dog-nutrition.webp',
    'fat.webp',
    'fiber.webp',
    'fish_oil.webp',
    'fitness_training.webp',
    'lean-mass.webp',
    'protein.webp',
    'run_distance.webp',
    'run_pace.webp',
    'shoulder-height.webp',
    'stool.webp',
    'training.webp',
    'vaccination.webp',
    'vomiting.webp',
    'waist.webp',
    'water.webp',
    'weight-management.webp',
];

const OUTPUT_DIR = path.resolve(__dirname, '../public/static/images/articles');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Create a 1x1 transparent WebP placeholder
// This is the smallest valid WebP file (26 bytes)
const PLACEHOLDER_WEBP = Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00,
    0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x4c,
    0x0d, 0x00, 0x00, 0x00, 0x2f, 0x00, 0x00, 0x00,
    0x00, 0x00
]);

console.log(`[generate-article-placeholders] Creating ${REQUIRED_COVERS.length} placeholder images...`);

let created = 0;
let skipped = 0;

for (const filename of REQUIRED_COVERS) {
    const filepath = path.join(OUTPUT_DIR, filename);

    if (fs.existsSync(filepath)) {
        skipped++;
        continue;
    }

    fs.writeFileSync(filepath, PLACEHOLDER_WEBP);
    created++;
}

console.log(`[generate-article-placeholders] Created ${created} placeholders, skipped ${skipped} existing files`);
console.log(`[generate-article-placeholders] Total size: ${(PLACEHOLDER_WEBP.length * created / 1024).toFixed(2)}KB`);
