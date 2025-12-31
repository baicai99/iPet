#!/bin/bash

OUTPUT_FILE="deploy.zip"
TEMP_DIR="deploy_temp"

# Clean up previous runs
rm -f "$OUTPUT_FILE"
rm -rf "$TEMP_DIR"

echo "📦 Packaging project for deployment..."

# Create temp structure
mkdir -p "$TEMP_DIR"

# Copy backend files
# We use rsync to exclude unwanted files
# We copy current dir content to deploy_temp/iPet-BackEnd
mkdir -p "$TEMP_DIR/iPet-BackEnd"
rsync -av . "$TEMP_DIR/iPet-BackEnd" \
    --exclude node_modules \
    --exclude dist \
    --exclude .git \
    --exclude .DS_Store \
    --exclude .env \
    --exclude .env.* \
    --exclude deploy.zip \
    --exclude docs \
    --exclude perf \
    --exclude AGENTS.md \
    --exclude verify_fix.sh \
    --exclude 后端架构总结.md \
    --exclude coverage \
    --exclude test \
    --exclude "$TEMP_DIR"

# Zip the temp directory contents
cd "$TEMP_DIR"
zip -r "../$OUTPUT_FILE" .
cd ..

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ Done! Created $OUTPUT_FILE"
echo "👉 Upload this file to your server."
echo "   It contains the 'iPet-BackEnd' folder."
echo "   1. Unzip it."
echo "   2. cd iPet-BackEnd"
echo "   3. npm install"
echo "   4. npm run build"
echo "   5. npx prisma migrate deploy"
echo "   6. npm run start:prod"
