#!/bin/bash
# System Integration Tests for Le Tip Lead System
# Following TDD: Each test should fail first, then pass after fix

set -e

BACKEND_PORT=3030
FRONTEND_PORT=3031
BACKEND_URL="http://localhost:$BACKEND_PORT"
FRONTEND_URL="http://localhost:$FRONTEND_PORT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

pass() {
  echo -e "${GREEN}PASS${NC}: $1"
  ((PASSED++))
}

fail() {
  echo -e "${RED}FAIL${NC}: $1"
  echo "       Expected: $2"
  echo "       Got: $3"
  ((FAILED++))
}

echo "========================================"
echo "Le Tip Lead System - Integration Tests"
echo "========================================"
echo ""

# Test 1: Backend health check
echo "Test 1: Backend responds on port $BACKEND_PORT"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health" 2>/dev/null || echo "000")
if [ "$HEALTH" = "200" ]; then
  pass "Backend health check returns 200"
else
  fail "Backend health check" "HTTP 200" "HTTP $HEALTH"
fi

# Test 2: CORS preflight for auth/register
echo ""
echo "Test 2: CORS preflight returns proper headers"
CORS_RESPONSE=$(curl -s -I -X OPTIONS "$BACKEND_URL/api/auth/register" \
  -H "Origin: $FRONTEND_URL" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" 2>/dev/null)

CORS_STATUS=$(echo "$CORS_RESPONSE" | grep -i "HTTP" | head -1 | awk '{print $2}')
CORS_ORIGIN=$(echo "$CORS_RESPONSE" | grep -i "access-control-allow-origin" | tr -d '\r')

if [ "$CORS_STATUS" = "204" ] || [ "$CORS_STATUS" = "200" ]; then
  pass "CORS preflight returns $CORS_STATUS"
else
  fail "CORS preflight status" "HTTP 200 or 204" "HTTP $CORS_STATUS"
fi

if echo "$CORS_ORIGIN" | grep -q "$FRONTEND_URL"; then
  pass "CORS allows origin $FRONTEND_URL"
else
  fail "CORS origin header" "Contains $FRONTEND_URL" "$CORS_ORIGIN"
fi

# Test 3: Registration endpoint accepts POST
echo ""
echo "Test 3: Registration endpoint works"
REG_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -H "Origin: $FRONTEND_URL" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}' 2>/dev/null)

# Should get either success (user created) or conflict (user exists) - both are valid
if echo "$REG_RESPONSE" | grep -qE "(accessToken|already exists|Conflict)"; then
  pass "Registration endpoint responds correctly"
else
  fail "Registration endpoint" "accessToken or conflict" "$REG_RESPONSE"
fi

# Test 4: Frontend responds
echo ""
echo "Test 4: Frontend responds on port $FRONTEND_PORT"
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
if [ "$FRONTEND_HEALTH" = "200" ]; then
  pass "Frontend responds with 200"
else
  fail "Frontend health check" "HTTP 200" "HTTP $FRONTEND_HEALTH"
fi

# Test 5: Login endpoint
echo ""
echo "Test 5: Login endpoint works"
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "Origin: $FRONTEND_URL" \
  -d '{"email":"test@example.com","password":"Test123!"}' 2>/dev/null)

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
  pass "Login returns access token"
else
  fail "Login endpoint" "accessToken in response" "$LOGIN_RESPONSE"
fi

# Test 6: Protected endpoint with token
echo ""
echo "Test 6: Protected endpoint works with token"
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
  ME_RESPONSE=$(curl -s "$BACKEND_URL/api/auth/me" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Origin: $FRONTEND_URL" 2>/dev/null)

  if echo "$ME_RESPONSE" | grep -q "email"; then
    pass "Protected endpoint returns user data"
  else
    fail "Protected endpoint" "User email in response" "$ME_RESPONSE"
  fi
else
  fail "Protected endpoint" "Token available" "No token from login"
fi

# Summary
echo ""
echo "========================================"
echo "Results: $PASSED passed, $FAILED failed"
echo "========================================"

if [ $FAILED -gt 0 ]; then
  exit 1
fi
exit 0
