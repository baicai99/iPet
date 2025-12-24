#!/bin/bash
# ============================================================================
# iPet CI/CD Migration Gate Script
# 
# 迁移门禁脚本 - 检查并应用 Prisma 迁移
# 存在未应用迁移时将阻断部署（返回非零退出码）
#
# 用法:
#   bash scripts/ci_gate_migrations.sh
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "============================================"
echo "  iPet Migration Gate"
echo "  Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""

# Step 1: Run prisma migrate deploy
echo -e "${YELLOW}[STEP 1]${NC} Running prisma migrate deploy..."

if npx prisma migrate deploy; then
    echo -e "${GREEN}✓${NC} Migration deploy completed"
else
    echo -e "${RED}✗${NC} Migration deploy failed"
    exit 1
fi

echo ""

# Step 2: Check migration status
echo -e "${YELLOW}[STEP 2]${NC} Checking migration status..."

# Capture migrate status output
STATUS_OUTPUT=$(npx prisma migrate status 2>&1) || true

echo "$STATUS_OUTPUT"
echo ""

# Check for pending migrations indicators
if echo "$STATUS_OUTPUT" | grep -q "have not yet been applied"; then
    echo -e "${RED}✗${NC} FAIL - Pending migrations detected!"
    echo "    Please run 'npx prisma migrate deploy' to apply pending migrations."
    exit 1
fi

if echo "$STATUS_OUTPUT" | grep -q "following migration have not yet been applied"; then
    echo -e "${RED}✗${NC} FAIL - Pending migrations detected!"
    echo "    Please run 'npx prisma migrate deploy' to apply pending migrations."
    exit 1
fi

if echo "$STATUS_OUTPUT" | grep -q "Database schema is up to date"; then
    echo -e "${GREEN}✓${NC} Database schema is up to date"
fi

echo ""
echo "============================================"
echo -e "  ${GREEN}PASS${NC} - Migration gate passed"
echo "============================================"

exit 0
