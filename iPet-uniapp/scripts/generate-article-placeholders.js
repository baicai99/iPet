#!/usr/bin/env node

/**
 * Generate placeholder article cover images
 * This is a temporary solution until real cover images are provided
 */

const fs = require('fs');
const path = require('path');

// Required cover images from article frontmatter
const REQUIRED_COVERS = [
    'anxiety.jpg',
    'bathing.jpg',
    'bmi.jpg',
    'body-fat.jpg',
    'body-temp.jpg',
    'calcium.jpg',
    'carb.jpg',
    'dental-care.jpg',
    'depression.jpg',
    'deworming.jpg',
    'diet_energy.jpg',
    'dog-exercise.jpg',
    'dog-nutrition.jpg',
    'fat.jpg',
    'fiber.jpg',
    'fish_oil.jpg',
    'fitness_training.jpg',
    'lean-mass.jpg',
    'protein.jpg',
    'run_distance.jpg',
    'run_pace.jpg',
    'shoulder-height.jpg',
    'stool.jpg',
    'training.jpg',
    'vaccination.jpg',
    'vomiting.jpg',
    'waist.jpg',
    'water.jpg',
    'weight-management.jpg',
];

const OUTPUT_DIR = path.resolve(__dirname, '../public/static/images/articles');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Create a 1x1 JPG placeholder (smallest valid JPEG)
const PLACEHOLDER_JPG = Buffer.from(
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAABAAEBAREA/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAXAQEAAwAAAAAAAAAAAAAAAAABAAID/8QAFQEBAQAAAAAAAAAAAAAAAAAAAQT/xAAXEQEAAwAAAAAAAAAAAAAAAAABABEh/9oADAMBAAIRAxEAPwCqgA//2Q==',
    'base64'
);

console.log(`[generate-article-placeholders] Creating ${REQUIRED_COVERS.length} placeholder images...`);

let created = 0;
let skipped = 0;

for (const filename of REQUIRED_COVERS) {
    const filepath = path.join(OUTPUT_DIR, filename);

    if (fs.existsSync(filepath)) {
        skipped++;
        continue;
    }

    fs.writeFileSync(filepath, PLACEHOLDER_JPG);
    created++;
}

console.log(`[generate-article-placeholders] Created ${created} placeholders, skipped ${skipped} existing files`);
console.log(`[generate-article-placeholders] Total size: ${(PLACEHOLDER_JPG.length * created / 1024).toFixed(2)}KB`);
