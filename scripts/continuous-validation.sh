#!/bin/bash

##############################################################################
# Continuous Validation Script
# Purpose: Run baseline tests every 5 minutes during parallel refactoring
# Monitors: API contracts, Database integrity, WebSocket events
# Logs: All test results to /tmp/letip-test-results.csv and /tmp/letip-alerts.txt
##############################################################################

set -e

PROJECT_ROOT="/Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system"
BACKEND_DIR="$PROJECT_ROOT/App/BackEnd"
LOG_DIR="/tmp/letip-monitoring"
TEST_RESULTS_CSV="$LOG_DIR/test-results.csv"
ALERTS_LOG="$LOG_DIR/alerts.txt"
PERFORMANCE_LOG="$LOG_DIR/performance.log"
LAST_STATUS_FILE="$LOG_DIR/last-status.txt"

# Create log directory
mkdir -p "$LOG_DIR"

# Initialize CSV header if it doesn't exist
if [ ! -f "$TEST_RESULTS_CSV" ]; then
  echo "timestamp,total_tests,passing,failing,pass_rate,duration_ms" > "$TEST_RESULTS_CSV"
fi

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

##############################################################################
# Function: Log Alert
# Purpose: Log test failures and alert conditions
##############################################################################
log_alert() {
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local message="$1"
  echo "[$timestamp] ALERT: $message" | tee -a "$ALERTS_LOG"
}

##############################################################################
# Function: Run Baseline Tests
# Purpose: Execute all baseline test suites (API, Database, WebSocket)
##############################################################################
run_baseline_tests() {
  echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] ===== Running Baseline Tests =====${NC}"

  cd "$BACKEND_DIR"

  # Create a temporary results file
  local temp_results="/tmp/test-output-$$.json"

  # Run e2e tests with JSON reporter
  local start_time=$(date +%s%N)

  npm run test:e2e -- \
    --testTimeout=30000 \
    --passWithNoTests \
    --json \
    --outputFile="$temp_results" \
    2>&1 | tee -a "$LOG_DIR/test-run.log"

  local exit_code=$?
  local end_time=$(date +%s%N)
  local duration_ms=$(( (end_time - start_time) / 1000000 ))

  # Parse test results
  if [ -f "$temp_results" ]; then
    local total=$(jq '.numTotalTests' "$temp_results" 2>/dev/null || echo "0")
    local passing=$(jq '.numPassedTests' "$temp_results" 2>/dev/null || echo "0")
    local failing=$(jq '.numFailedTests' "$temp_results" 2>/dev/null || echo "0")
  else
    # Fallback: count from Jest output
    local total=0
    local passing=0
    local failing=0
  fi

  # Calculate pass rate
  if [ "$total" -gt 0 ]; then
    local pass_rate=$(( (passing * 100) / total ))
  else
    local pass_rate=0
  fi

  # Log to CSV
  local timestamp=$(date '+%s')
  echo "$timestamp,$total,$passing,$failing,$pass_rate%,$duration_ms" >> "$TEST_RESULTS_CSV"

  # Determine status
  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ PASSED: $passing/$total tests (${pass_rate}%) - ${duration_ms}ms${NC}"
    echo "PASS" > "$LAST_STATUS_FILE"
    return 0
  else
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ FAILED: $passing/$total tests (${pass_rate}%) - ${duration_ms}ms${NC}"
    log_alert "Baseline tests FAILED - Pass rate: ${pass_rate}%"
    echo "FAIL" > "$LAST_STATUS_FILE"
    return 1
  fi
}

##############################################################################
# Function: Check Server Health
# Purpose: Verify backend API is responding
##############################################################################
check_server_health() {
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

  # Check if server is responding
  if curl -f -s -m 5 http://localhost:3000/api/businesses/stats > /dev/null 2>&1; then
    echo -e "${GREEN}[$timestamp] ✅ Server responding${NC}"
    return 0
  else
    echo -e "${RED}[$timestamp] ❌ Server NOT responding${NC}"
    log_alert "Backend server at localhost:3000 is not responding"
    return 1
  fi
}

##############################################################################
# Function: Track Performance
# Purpose: Monitor API response times
##############################################################################
track_performance() {
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "" >> "$PERFORMANCE_LOG"
  echo "[$timestamp] Performance Baseline" >> "$PERFORMANCE_LOG"

  # Test stats endpoint
  local stats_time=$( { time curl -s http://localhost:3000/api/businesses/stats > /dev/null; } 2>&1 | grep real | awk '{print $2}')
  echo "  Stats API: $stats_time" >> "$PERFORMANCE_LOG"

  # Test list endpoint
  local list_time=$( { time curl -s 'http://localhost:3000/api/businesses?limit=20' > /dev/null; } 2>&1 | grep real | awk '{print $2}')
  echo "  List API: $list_time" >> "$PERFORMANCE_LOG"
}

##############################################################################
# Function: Generate Status Report
# Purpose: Create hourly status summary
##############################################################################
generate_status_report() {
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local last_status=$(cat "$LAST_STATUS_FILE" 2>/dev/null || echo "UNKNOWN")
  local alert_count=$(wc -l < "$ALERTS_LOG" 2>/dev/null || echo "0")

  {
    echo ""
    echo "===== Hourly Status Report - $timestamp ====="
    echo "Baseline Tests: $last_status"
    echo "Alerts: $alert_count"
    echo "Log Files:"
    echo "  - CSV Results: $TEST_RESULTS_CSV"
    echo "  - Alerts Log: $ALERTS_LOG"
    echo "  - Performance: $PERFORMANCE_LOG"
    echo "======================================"
    echo ""
  } | tee -a "$LOG_DIR/hourly-reports.log"
}

##############################################################################
# Main Continuous Monitoring Loop
##############################################################################
main() {
  echo -e "${BLUE}Starting Continuous Validation Service${NC}"
  echo "Log Directory: $LOG_DIR"
  echo "CSV Results: $TEST_RESULTS_CSV"
  echo "Alerts: $ALERTS_LOG"
  echo ""

  local iteration=0
  local last_report_time=$(date +%s)

  while true; do
    iteration=$((iteration + 1))
    local current_time=$(date +%s)
    local time_since_report=$((current_time - last_report_time))

    echo ""
    echo "=============================================================================="
    echo "Iteration $iteration at $(date '+%Y-%m-%d %H:%M:%S')"
    echo "=============================================================================="

    # Run baseline tests
    run_baseline_tests

    # Check server health
    check_server_health

    # Track performance
    track_performance

    # Generate hourly report (every 3600 seconds = 1 hour)
    if [ $time_since_report -ge 3600 ]; then
      generate_status_report
      last_report_time=$current_time
    fi

    # Wait 300 seconds (5 minutes) before next run
    echo ""
    echo "Next check in 300 seconds (5 minutes)..."
    sleep 300
  done
}

# Run main function
main
