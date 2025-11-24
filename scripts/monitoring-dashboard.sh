#!/bin/bash

##############################################################################
# Real-Time Monitoring Dashboard
# Purpose: Display current monitoring status in terminal
# Updates: Every 10 seconds
##############################################################################

set -e

PROJECT_ROOT="/Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system"
LOG_DIR="/tmp/letip-monitoring"
TEST_RESULTS_CSV="$LOG_DIR/test-results.csv"
REDIS_LOG="$LOG_DIR/redis-memory.log"
ALERTS_LOG="$LOG_DIR/alerts.txt"
PERFORMANCE_LOG="$LOG_DIR/performance.log"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
NC='\033[0m' # No Color

##############################################################################
# Function: Get Latest Test Results
##############################################################################
get_latest_test_results() {
  if [ ! -f "$TEST_RESULTS_CSV" ]; then
    echo "N/A|N/A|N/A|N/A"
    return
  fi

  # Get last line (skip header)
  local latest=$(tail -2 "$TEST_RESULTS_CSV" | head -1)

  if [ -z "$latest" ]; then
    echo "N/A|N/A|N/A|N/A"
    return
  fi

  # Parse: timestamp,total_tests,passing,failing,pass_rate,duration_ms
  IFS=',' read -r timestamp total passing failing pass_rate duration <<< "$latest"

  # Format timestamp
  local human_date=$(date -d @"$timestamp" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "Unknown")

  echo "$human_date|$passing/$total|$pass_rate|$duration"
}

##############################################################################
# Function: Get Latest Redis Metrics
##############################################################################
get_latest_redis_metrics() {
  if [ ! -f "$REDIS_LOG" ]; then
    echo "N/A|N/A|N/A"
    return
  fi

  # Get last line (skip header)
  local latest=$(tail -2 "$REDIS_LOG" | head -1)

  if [ -z "$latest" ]; then
    echo "N/A|N/A|N/A"
    return
  fi

  # Parse: timestamp,memory_mb,max_mb,memory_percent,key_count,db_size
  IFS=',' read -r timestamp memory_mb max_mb memory_percent key_count db_size <<< "$latest"

  echo "${memory_mb}MB/${max_mb}MB|${memory_percent}%|${key_count}"
}

##############################################################################
# Function: Get Alert Count
##############################################################################
get_alert_count() {
  if [ ! -f "$ALERTS_LOG" ]; then
    echo "0"
    return
  fi

  wc -l < "$ALERTS_LOG"
}

##############################################################################
# Function: Get Recent Alerts
##############################################################################
get_recent_alerts() {
  if [ ! -f "$ALERTS_LOG" ]; then
    echo "No alerts"
    return
  fi

  tail -5 "$ALERTS_LOG" | while read -r line; do
    echo "  $line"
  done
}

##############################################################################
# Function: Get CPU & Memory of Backend
##############################################################################
get_backend_resources() {
  # Check if backend process is running
  local pid=$(pgrep -f "nest start" 2>/dev/null | head -1)

  if [ -z "$pid" ]; then
    echo "N/A|N/A"
    return
  fi

  # Get process info (macOS ps syntax)
  local info=$(ps -p "$pid" -o %cpu,%mem 2>/dev/null | tail -1)

  if [ -z "$info" ]; then
    echo "N/A|N/A"
    return
  fi

  echo "$info"
}

##############################################################################
# Function: Get Server Status
##############################################################################
get_server_status() {
  if curl -f -s -m 2 http://localhost:3000/api/businesses/stats > /dev/null 2>&1; then
    echo "RUNNING"
    return 0
  else
    echo "OFFLINE"
    return 1
  fi
}

##############################################################################
# Function: Draw Dashboard
##############################################################################
draw_dashboard() {
  clear

  # Get current metrics
  local test_data=$(get_latest_test_results)
  local redis_data=$(get_latest_redis_metrics)
  local alert_count=$(get_alert_count)
  local backend_resources=$(get_backend_resources)
  local server_status=$(get_server_status)

  IFS='|' read -r test_time test_results test_rate test_duration <<< "$test_data"
  IFS='|' read -r redis_memory redis_percent redis_keys <<< "$redis_data"
  IFS='|' read -r cpu_usage mem_usage <<< "$backend_resources"

  # Header
  echo -e "${BOLD}${BLUE}"
  echo "╔════════════════════════════════════════════════════════════════════════════════╗"
  echo "║                  LETIP CONTINUOUS MONITORING DASHBOARD                        ║"
  echo "║                         Real-Time Status Monitor                               ║"
  echo "╚════════════════════════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"

  # Current Time
  local current_time=$(date '+%Y-%m-%d %H:%M:%S')
  echo -e "  ${CYAN}Updated: $current_time${NC}"
  echo ""

  # Test Status Section
  echo -e "${BOLD}┌─ TEST EXECUTION STATUS${NC}"
  echo -e "${BOLD}│${NC}"

  if [ "$test_results" != "N/A" ]; then
    # Determine test status color
    if [[ "$test_rate" == "100%" ]]; then
      test_color=$GREEN
      test_status="✅ PASS"
    elif [[ "$test_rate" =~ ^9[0-9]% ]]; then
      test_color=$YELLOW
      test_status="⚠️  WARNING"
    else
      test_color=$RED
      test_status="❌ FAIL"
    fi

    echo -e "${BOLD}│${NC}  Last Run:     $test_time"
    echo -e "${BOLD}│${NC}  Results:      ${test_color}$test_results${NC}"
    echo -e "${BOLD}│${NC}  Pass Rate:    ${test_color}$test_rate${NC}"
    echo -e "${BOLD}│${NC}  Duration:     ${CYAN}${test_duration}ms${NC}"
  else
    echo -e "${BOLD}│${NC}  Status:       ${YELLOW}Waiting for first test run...${NC}"
  fi

  echo -e "${BOLD}│${NC}"
  echo -e "${BOLD}└─${NC} Next run in ~5 minutes"
  echo ""

  # Redis Status Section
  echo -e "${BOLD}┌─ REDIS MEMORY MONITOR${NC}"
  echo -e "${BOLD}│${NC}"

  if [ "$redis_memory" != "N/A" ]; then
    # Determine memory status color
    if [[ "$redis_percent" -lt 70 ]]; then
      redis_color=$GREEN
      redis_status="✅ OK"
    elif [[ "$redis_percent" -lt 90 ]]; then
      redis_color=$YELLOW
      redis_status="⚠️  WARNING"
    else
      redis_color=$RED
      redis_status="❌ CRITICAL"
    fi

    echo -e "${BOLD}│${NC}  Memory:       ${redis_color}$redis_memory${NC} (${redis_status})"
    echo -e "${BOLD}│${NC}  Usage:        ${redis_color}$redis_percent${NC}"
    echo -e "${BOLD}│${NC}  Key Count:    ${CYAN}$redis_keys keys${NC}"
  else
    echo -e "${BOLD}│${NC}  Status:       ${YELLOW}Waiting for first measurement...${NC}"
  fi

  echo -e "${BOLD}│${NC}"
  echo -e "${BOLD}└─${NC} Updated every 60 seconds"
  echo ""

  # Server Status Section
  echo -e "${BOLD}┌─ BACKEND SERVER STATUS${NC}"
  echo -e "${BOLD}│${NC}"

  if [ "$server_status" = "RUNNING" ]; then
    server_color=$GREEN
    server_icon="✅"
  else
    server_color=$RED
    server_icon="❌"
  fi

  echo -e "${BOLD}│${NC}  Status:       ${server_color}${server_icon} $server_status${NC}"

  if [ "$server_status" = "RUNNING" ] && [ "$cpu_usage" != "N/A" ]; then
    echo -e "${BOLD}│${NC}  CPU Usage:    ${CYAN}${cpu_usage}${NC}"
    echo -e "${BOLD}│${NC}  Memory:       ${CYAN}${mem_usage}${NC}"
  fi

  echo -e "${BOLD}│${NC}"
  echo -e "${BOLD}└─${NC} Checked every 30 seconds"
  echo ""

  # Alerts Section
  echo -e "${BOLD}┌─ ALERTS & ISSUES${NC}"
  echo -e "${BOLD}│${NC}"

  if [ "$alert_count" -gt 0 ]; then
    echo -e "${BOLD}│${NC}  Total Alerts: ${RED}$alert_count${NC}"
    echo -e "${BOLD}│${NC}  Recent:"
    get_recent_alerts
  else
    echo -e "${BOLD}│${NC}  Total Alerts: ${GREEN}0${NC}"
    echo -e "${BOLD}│${NC}  Status:       ${GREEN}✅ No issues detected${NC}"
  fi

  echo -e "${BOLD}│${NC}"
  echo -e "${BOLD}└─${NC} Check /tmp/letip-monitoring/alerts.txt for details"
  echo ""

  # Footer
  echo -e "${BOLD}${BLUE}┌─ MONITORING INFORMATION${NC}"
  echo -e "${BOLD}│${NC}"
  echo -e "${BOLD}│${NC}  Log Directory:  /tmp/letip-monitoring/"
  echo -e "${BOLD}│${NC}  Test Results:   test-results.csv"
  echo -e "${BOLD}│${NC}  Redis Metrics:  redis-memory.log"
  echo -e "${BOLD}│${NC}  Alerts:         alerts.txt"
  echo -e "${BOLD}│${NC}  Performance:    performance.log"
  echo -e "${BOLD}│${NC}"
  echo -e "${BOLD}│${NC}  Agent Agents: 5 refactoring in parallel"
  echo -e "${BOLD}│${NC}  Test Suites:  API, Database, WebSocket (baseline)"
  echo -e "${BOLD}│${NC}"
  echo -e "${BOLD}└─${NC} Press Ctrl+C to exit"
  echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "${CYAN}Refreshing in 10 seconds... (refresh rate: every 10 seconds)${NC}"
}

##############################################################################
# Main Loop
##############################################################################
main() {
  while true; do
    draw_dashboard
    sleep 10
  done
}

# Trap Ctrl+C to exit gracefully
trap 'echo -e "\n${CYAN}Dashboard stopped${NC}"; exit 0' INT

# Run main
main
