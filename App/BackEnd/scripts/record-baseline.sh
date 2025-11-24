#!/bin/bash
###############################################################################
# Baseline Recording Script
#
# Purpose: Record comprehensive baseline metrics before refactoring.
# Captures test coverage, performance benchmarks, and architectural state.
#
# Usage:
#   ./scripts/record-baseline.sh
#   npm run record:baseline
#
# Output:
#   - REFACTORING_LOG.md (baseline metrics)
#   - coverage/ (test coverage reports)
#   - baseline-metrics.json (machine-readable data)
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Determine script location and project structure
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$BACKEND_DIR/../.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/App/FrontEnd"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Baseline Recording Script${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if we're in the right directory
if [ ! -f "$BACKEND_DIR/package.json" ]; then
    echo -e "${RED}Error: Backend package.json not found${NC}"
    echo "Please run this script from the project root"
    exit 1
fi

###############################################################################
# Step 1: Run Backend Tests with Coverage
###############################################################################
echo -e "${YELLOW}Step 1: Running backend tests with coverage...${NC}"
cd "$BACKEND_DIR"

# Run unit tests with coverage
npm run test:cov 2>&1 | tee /tmp/backend-test-output.txt

# Run e2e baseline tests
npm run test:e2e -- baseline/ --testTimeout=30000 2>&1 | tee /tmp/backend-e2e-output.txt

# Extract coverage percentages
BACKEND_COVERAGE=$(grep -o '[0-9]\+\.[0-9]\+' coverage/coverage-summary.json | head -1 || echo "0")

echo -e "${GREEN}✓ Backend tests completed${NC}"
echo -e "  Coverage: ${BACKEND_COVERAGE}%\n"

###############################################################################
# Step 2: Count Test Files
###############################################################################
echo -e "${YELLOW}Step 2: Counting test files...${NC}"

BACKEND_UNIT_TESTS=$(find "$BACKEND_DIR/src" -name "*.spec.ts" | wc -l | tr -d ' ')
BACKEND_E2E_TESTS=$(find "$BACKEND_DIR/test" -name "*.e2e-spec.ts" | wc -l | tr -d ' ')
BACKEND_BASELINE_TESTS=$(find "$BACKEND_DIR/test/baseline" -name "*.e2e-spec.ts" 2>/dev/null | wc -l | tr -d ' ')

echo -e "${GREEN}✓ Test files counted${NC}"
echo -e "  Unit tests: $BACKEND_UNIT_TESTS"
echo -e "  E2E tests: $BACKEND_E2E_TESTS"
echo -e "  Baseline tests: $BACKEND_BASELINE_TESTS\n"

###############################################################################
# Step 3: Analyze Code Structure
###############################################################################
echo -e "${YELLOW}Step 3: Analyzing code structure...${NC}"

# Count source files
TOTAL_TS_FILES=$(find "$BACKEND_DIR/src" -name "*.ts" ! -name "*.spec.ts" | wc -l | tr -d ' ')
CONTROLLER_FILES=$(find "$BACKEND_DIR/src" -name "*.controller.ts" | wc -l | tr -d ' ')
SERVICE_FILES=$(find "$BACKEND_DIR/src" -name "*.service.ts" | wc -l | tr -d ' ')
MODULE_FILES=$(find "$BACKEND_DIR/src" -name "*.module.ts" | wc -l | tr -d ' ')

# Count modules
MODULES=$(find "$BACKEND_DIR/src" -type d -name "*Module*" -o -name "businesses" -o -name "scraper" -o -name "enrichment" -o -name "outreach" | grep -v node_modules | wc -l | tr -d ' ')

echo -e "${GREEN}✓ Code structure analyzed${NC}"
echo -e "  Total TypeScript files: $TOTAL_TS_FILES"
echo -e "  Controllers: $CONTROLLER_FILES"
echo -e "  Services: $SERVICE_FILES"
echo -e "  Modules: $MODULE_FILES"
echo -e "  Feature modules: $MODULES\n"

###############################################################################
# Step 4: Database Schema Analysis
###############################################################################
echo -e "${YELLOW}Step 4: Analyzing database schema...${NC}"

# Count Prisma models
PRISMA_MODELS=$(grep -c "^model" "$BACKEND_DIR/prisma/schema.prisma" || echo "0")

# Count relationships
PRISMA_RELATIONS=$(grep -c "@relation" "$BACKEND_DIR/prisma/schema.prisma" || echo "0")

echo -e "${GREEN}✓ Database schema analyzed${NC}"
echo -e "  Prisma models: $PRISMA_MODELS"
echo -e "  Relationships: $PRISMA_RELATIONS\n"

###############################################################################
# Step 5: API Endpoint Count
###############################################################################
echo -e "${YELLOW}Step 5: Counting API endpoints...${NC}"

# Count API decorators
GET_ENDPOINTS=$(grep -r "@Get()" "$BACKEND_DIR/src" | wc -l | tr -d ' ')
POST_ENDPOINTS=$(grep -r "@Post()" "$BACKEND_DIR/src" | wc -l | tr -d ' ')
PUT_ENDPOINTS=$(grep -r "@Put()" "$BACKEND_DIR/src" | wc -l | tr -d ' ')
DELETE_ENDPOINTS=$(grep -r "@Delete()" "$BACKEND_DIR/src" | wc -l | tr -d ' ')
TOTAL_ENDPOINTS=$((GET_ENDPOINTS + POST_ENDPOINTS + PUT_ENDPOINTS + DELETE_ENDPOINTS))

echo -e "${GREEN}✓ API endpoints counted${NC}"
echo -e "  Total endpoints: $TOTAL_ENDPOINTS"
echo -e "  GET: $GET_ENDPOINTS, POST: $POST_ENDPOINTS, PUT: $PUT_ENDPOINTS, DELETE: $DELETE_ENDPOINTS\n"

###############################################################################
# Step 6: Generate Baseline Metrics JSON
###############################################################################
echo -e "${YELLOW}Step 6: Generating baseline metrics JSON...${NC}"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat > "$BACKEND_DIR/baseline-metrics.json" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "version": "1.0.0",
  "phase": "pre-refactoring",
  "tests": {
    "unit": $BACKEND_UNIT_TESTS,
    "e2e": $BACKEND_E2E_TESTS,
    "baseline": $BACKEND_BASELINE_TESTS,
    "coverage_percentage": $BACKEND_COVERAGE
  },
  "code_structure": {
    "total_files": $TOTAL_TS_FILES,
    "controllers": $CONTROLLER_FILES,
    "services": $SERVICE_FILES,
    "modules": $MODULE_FILES,
    "feature_modules": $MODULES
  },
  "database": {
    "models": $PRISMA_MODELS,
    "relationships": $PRISMA_RELATIONS
  },
  "api": {
    "total_endpoints": $TOTAL_ENDPOINTS,
    "get": $GET_ENDPOINTS,
    "post": $POST_ENDPOINTS,
    "put": $PUT_ENDPOINTS,
    "delete": $DELETE_ENDPOINTS
  }
}
EOF

echo -e "${GREEN}✓ Baseline metrics saved to baseline-metrics.json${NC}\n"

###############################################################################
# Step 7: Display Summary
###############################################################################
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Baseline Recording Complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${GREEN}Summary:${NC}"
echo -e "  • Backend test coverage: ${BACKEND_COVERAGE}%"
echo -e "  • Total test files: $((BACKEND_UNIT_TESTS + BACKEND_E2E_TESTS + BACKEND_BASELINE_TESTS))"
echo -e "  • Total TypeScript files: $TOTAL_TS_FILES"
echo -e "  • API endpoints: $TOTAL_ENDPOINTS"
echo -e "  • Database models: $PRISMA_MODELS"
echo -e ""
echo -e "${GREEN}Next Steps:${NC}"
echo -e "  1. Review REFACTORING_LOG.md for baseline metrics"
echo -e "  2. Run validation: npm run validate:imports"
echo -e "  3. Begin Phase 2: Scraper vertical slice refactoring"
echo -e ""
