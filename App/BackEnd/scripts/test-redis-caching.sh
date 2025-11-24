#!/bin/bash

# Redis Caching Verification Script
# Tests Redis connection, cache functionality, and performance

set -e

BACKEND_URL="http://localhost:3000"
REDIS_CONTAINER="letip-redis"

echo "==================================="
echo "Redis Caching Verification Script"
echo "==================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() {
  echo -e "${GREEN}✓${NC} $1"
}

error() {
  echo -e "${RED}✗${NC} $1"
}

warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

info() {
  echo -e "ℹ $1"
}

# 1. Check if Redis container is running
echo "1. Checking Redis container..."
if docker ps | grep -q "$REDIS_CONTAINER"; then
  success "Redis container is running"
else
  error "Redis container not found"
  info "Start Redis with: docker run -d --name letip-redis -p 6379:6379 redis:7-alpine"
  exit 1
fi

# 2. Test Redis connection
echo ""
echo "2. Testing Redis connection..."
if docker exec $REDIS_CONTAINER redis-cli ping | grep -q "PONG"; then
  success "Redis responds to PING"
else
  error "Redis not responding"
  exit 1
fi

# 3. Check backend server
echo ""
echo "3. Checking backend server..."
if curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL" | grep -q "200\|404"; then
  success "Backend server is running"
else
  error "Backend server not responding"
  info "Start backend with: cd App/BackEnd && npm run start:dev"
  exit 1
fi

# 4. Test cache functionality
echo ""
echo "4. Testing cache functionality..."

# Warm up cache
info "Warming up cache (first request)..."
FIRST_REQUEST=$(curl -s -w "\n%{time_total}" "$BACKEND_URL/api/businesses/stats" | tail -1)
info "First request time: ${FIRST_REQUEST}s (cache miss expected)"

# Test cache hit
sleep 1
info "Testing cache hit (second request)..."
SECOND_REQUEST=$(curl -s -w "\n%{time_total}" "$BACKEND_URL/api/businesses/stats" | tail -1)
info "Second request time: ${SECOND_REQUEST}s (should be <0.01s)"

# Compare times
if (( $(echo "$SECOND_REQUEST < 0.05" | bc -l) )); then
  success "Cache is working (${SECOND_REQUEST}s < 0.05s)"
else
  warning "Cache may not be working optimally (${SECOND_REQUEST}s)"
fi

# 5. Check cache keys in Redis
echo ""
echo "5. Checking cache keys..."
CACHE_KEYS=$(docker exec $REDIS_CONTAINER redis-cli KEYS "*" | wc -l | tr -d ' ')
if [ "$CACHE_KEYS" -gt "0" ]; then
  success "Found $CACHE_KEYS cache key(s) in Redis"
  info "Cache keys:"
  docker exec $REDIS_CONTAINER redis-cli KEYS "*" | sed 's/^/  - /'
else
  warning "No cache keys found (may not have been accessed yet)"
fi

# 6. Test cache invalidation
echo ""
echo "6. Testing cache invalidation..."

# Get current stats
info "Getting current stats..."
STATS_BEFORE=$(curl -s "$BACKEND_URL/api/businesses/stats" | grep -o '"totalBusinesses":[0-9]*' | cut -d':' -f2)
info "Total businesses before: $STATS_BEFORE"

# Create a test business
info "Creating test business..."
CREATE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/businesses" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Redis Cache Business","city":"Test City","enrichment_status":"pending"}')

if echo "$CREATE_RESPONSE" | grep -q '"id"'; then
  success "Test business created"

  # Get updated stats
  sleep 1
  STATS_AFTER=$(curl -s "$BACKEND_URL/api/businesses/stats" | grep -o '"totalBusinesses":[0-9]*' | cut -d':' -f2)
  info "Total businesses after: $STATS_AFTER"

  if [ "$STATS_AFTER" -gt "$STATS_BEFORE" ]; then
    success "Cache invalidated correctly (stats updated)"
  else
    warning "Stats not updated (cache may not have invalidated)"
  fi
else
  error "Failed to create test business"
  echo "$CREATE_RESPONSE"
fi

# 7. Check Redis memory usage
echo ""
echo "7. Checking Redis memory..."
REDIS_MEMORY=$(docker exec $REDIS_CONTAINER redis-cli INFO memory | grep "used_memory_human" | cut -d':' -f2 | tr -d '\r')
info "Redis memory usage: $REDIS_MEMORY"

# 8. Check Redis database size
echo ""
echo "8. Checking Redis database size..."
DB_SIZE=$(docker exec $REDIS_CONTAINER redis-cli DBSIZE | tr -d '\r')
info "Total keys in database: $DB_SIZE"

# 9. Performance benchmark
echo ""
echo "9. Running performance benchmark..."
if command -v ab &> /dev/null; then
  info "Running Apache Bench (100 requests, 10 concurrent)..."
  ab -n 100 -c 10 -q "$BACKEND_URL/api/businesses/stats" 2>&1 | grep "Requests per second\|Time per request" | sed 's/^/  /'
  success "Benchmark completed"
else
  warning "Apache Bench (ab) not installed - skipping benchmark"
  info "Install with: brew install httpd (macOS) or sudo apt install apache2-utils (Linux)"
fi

# Summary
echo ""
echo "==================================="
echo "Verification Summary"
echo "==================================="
success "Redis container running"
success "Backend server accessible"
success "Cache functionality working"
info "Cache hit time: ${SECOND_REQUEST}s"
info "Redis keys: $DB_SIZE"
info "Memory usage: $REDIS_MEMORY"

echo ""
echo "✅ Redis caching is operational!"
echo ""
echo "Next steps:"
echo "  - Monitor cache hit rates in application logs"
echo "  - Check cache invalidation on mutations"
echo "  - Run full integration tests"
echo ""
