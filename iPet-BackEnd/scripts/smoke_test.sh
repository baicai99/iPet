#!/bin/bash
# ============================================================================
# iPet Smoke Test Script
# 
# 部署后冒烟测试 - 验证关键 API 端点可用性
# 任意步骤失败将阻断发布（返回非零退出码）
#
# 用法:
#   BASE_URL=http://localhost:3000 bash scripts/smoke_test.sh
# ============================================================================

set -o pipefail

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_BASE="${BASE_URL}/api"
TIMEOUT=10

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Test state
ACCESS_TOKEN=""
REFRESH_TOKEN=""
TEST_EMAIL=""
TEST_PASSWORD="SmokeTest123!"

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

log_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

# HTTP request helper with timeout
http_get() {
    curl -sf --max-time "$TIMEOUT" -H "Authorization: Bearer $ACCESS_TOKEN" "$1"
}

http_post() {
    local url="$1"
    local data="$2"
    curl -sf --max-time "$TIMEOUT" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d "$data" \
        "$url"
}

http_post_no_auth() {
    local url="$1"
    local data="$2"
    curl -sf --max-time "$TIMEOUT" \
        -H "Content-Type: application/json" \
        -d "$data" \
        "$url"
}

# ============================================================================
# Test Cases
# ============================================================================

test_infra_health() {
    log_info "Testing GET /api/infra/health"
    
    local response
    response=$(curl -sf --max-time "$TIMEOUT" "${API_BASE}/infra/health")
    
    if [ $? -eq 0 ] && echo "$response" | grep -q '"status"'; then
        log_pass "Infrastructure health check"
        return 0
    else
        log_fail "Infrastructure health check - endpoint unreachable or invalid response"
        return 1
    fi
}

test_guest_login() {
    log_info "Testing POST /api/auth/guest"
    
    local response
    response=$(http_post_no_auth "${API_BASE}/auth/guest" '{"origin":"smoke-test"}')
    
    if [ $? -eq 0 ]; then
        ACCESS_TOKEN=$(echo "$response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        REFRESH_TOKEN=$(echo "$response" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$ACCESS_TOKEN" ]; then
            log_pass "Guest login - token acquired"
            return 0
        fi
    fi
    
    log_fail "Guest login - failed to acquire token"
    return 1
}

test_get_me() {
    log_info "Testing GET /api/users/me"
    
    local response
    response=$(http_get "${API_BASE}/users/me")
    
    if [ $? -eq 0 ] && echo "$response" | grep -q '"id"'; then
        log_pass "Get current user (guest)"
        return 0
    else
        log_fail "Get current user - invalid response"
        return 1
    fi
}

test_register() {
    log_info "Testing POST /api/users/register"
    
    # Generate unique email for this test run
    TEST_EMAIL="smoke-$(date +%s)-$RANDOM@test.ipet.local"
    
    local payload
    payload=$(cat <<EOF
{
    "email": "$TEST_EMAIL",
    "password": "$TEST_PASSWORD",
    "nickname": "SmokeTest"
}
EOF
)
    
    local response
    response=$(http_post_no_auth "${API_BASE}/users/register" "$payload")
    
    if [ $? -eq 0 ]; then
        local new_token
        new_token=$(echo "$response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$new_token" ]; then
            log_pass "User registration - email: $TEST_EMAIL"
            return 0
        fi
    fi
    
    log_fail "User registration - failed"
    return 1
}

test_login() {
    log_info "Testing POST /api/auth/login"
    
    local payload
    payload=$(cat <<EOF
{
    "email": "$TEST_EMAIL",
    "password": "$TEST_PASSWORD"
}
EOF
)
    
    local response
    response=$(http_post_no_auth "${API_BASE}/auth/login" "$payload")
    
    if [ $? -eq 0 ]; then
        ACCESS_TOKEN=$(echo "$response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        REFRESH_TOKEN=$(echo "$response" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$ACCESS_TOKEN" ] && [ -n "$REFRESH_TOKEN" ]; then
            log_pass "User login"
            return 0
        fi
    fi
    
    log_fail "User login - failed"
    return 1
}

test_refresh() {
    log_info "Testing POST /api/auth/refresh"
    
    if [ -z "$REFRESH_TOKEN" ]; then
        log_fail "Token refresh - no refresh token available"
        return 1
    fi
    
    local payload
    payload="{\"refreshToken\": \"$REFRESH_TOKEN\"}"
    
    local response
    response=$(http_post_no_auth "${API_BASE}/auth/refresh" "$payload")
    
    if [ $? -eq 0 ]; then
        local new_token
        new_token=$(echo "$response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$new_token" ]; then
            log_pass "Token refresh"
            return 0
        fi
    fi
    
    log_fail "Token refresh - failed"
    return 1
}

# ============================================================================
# Main Execution
# ============================================================================

echo ""
echo "============================================"
echo "  iPet Smoke Test"
echo "  Target: $BASE_URL"
echo "  Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""

# Run tests in sequence (some depend on previous results)
test_infra_health || exit 1
test_guest_login || exit 1
test_get_me || exit 1
test_register || exit 1
test_login || exit 1
test_refresh || exit 1

echo ""
echo "============================================"
echo "  Results: $PASSED passed, $FAILED failed"
echo "============================================"

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}FAIL${NC} - Smoke test failed"
    exit 1
else
    echo -e "${GREEN}PASS${NC} - All smoke tests passed"
    exit 0
fi
