#!/bin/bash

##############################################################################
# Redis Memory Monitoring Script
# Purpose: Track Redis memory usage and database size during refactoring
# Monitors: Memory usage, Key counts, Command stats
# Logs: All metrics to /tmp/letip-monitoring/redis-memory.log
##############################################################################

LOG_DIR="/tmp/letip-monitoring"
REDIS_LOG="$LOG_DIR/redis-memory.log"
REDIS_STATS_LOG="$LOG_DIR/redis-stats.json"

# Create log directory
mkdir -p "$LOG_DIR"

# Initialize header
if [ ! -f "$REDIS_LOG" ]; then
  echo "timestamp,memory_mb,max_mb,memory_percent,key_count,db_size" > "$REDIS_LOG"
fi

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

##############################################################################
# Function: Get Redis Memory Info
# Purpose: Extract memory metrics from Redis
##############################################################################
get_redis_memory() {
  local container="letip-redis"
  local max_mb=256  # Default Redis memory limit

  # Check if container exists
  if ! docker inspect "$container" > /dev/null 2>&1; then
    echo "Container '$container' not found" >&2
    return 1
  fi

  # Get memory info from Redis
  local memory_info=$(docker exec "$container" redis-cli INFO memory 2>/dev/null)

  if [ -z "$memory_info" ]; then
    echo "Failed to get Redis memory info" >&2
    return 1
  fi

  # Extract values (in bytes)
  local used_memory=$(echo "$memory_info" | grep '^used_memory:' | cut -d: -f2 | tr -d '\r')
  local used_memory_rss=$(echo "$memory_info" | grep '^used_memory_rss:' | cut -d: -f2 | tr -d '\r')

  if [ -z "$used_memory_rss" ]; then
    used_memory_rss=$used_memory
  fi

  # Convert to MB
  local memory_mb=$((used_memory_rss / 1024 / 1024))
  local memory_percent=$((memory_mb * 100 / max_mb))

  echo "$memory_mb|$max_mb|$memory_percent"
}

##############################################################################
# Function: Get Key Count
# Purpose: Count keys across all databases
##############################################################################
get_key_count() {
  local container="letip-redis"

  # Get keyspace info
  local keyspace=$(docker exec "$container" redis-cli INFO keyspace 2>/dev/null)

  if [ -z "$keyspace" ]; then
    echo "0"
    return 1
  fi

  # Extract total keys
  local total_keys=0
  while IFS= read -r line; do
    if [[ $line =~ db[0-9]:keys=([0-9]+) ]]; then
      total_keys=$((total_keys + ${BASH_REMATCH[1]}))
    fi
  done <<< "$keyspace"

  echo "$total_keys"
}

##############################################################################
# Function: Get Database Size
# Purpose: Estimate memory used by data
##############################################################################
get_database_size() {
  local container="letip-redis"

  # Get memory breakdown
  local memory_info=$(docker exec "$container" redis-cli INFO memory 2>/dev/null)

  if [ -z "$memory_info" ]; then
    echo "0"
    return 1
  fi

  # Extract used memory (excluding overhead)
  local dataset_bytes=$(echo "$memory_info" | grep '^used_memory_dataset:' | cut -d: -f2 | tr -d '\r')

  if [ -z "$dataset_bytes" ]; then
    dataset_bytes=0
  fi

  local dataset_mb=$((dataset_bytes / 1024 / 1024))
  echo "$dataset_mb"
}

##############################################################################
# Function: Check Memory Threshold
# Purpose: Alert if memory usage is too high
##############################################################################
check_memory_threshold() {
  local memory_percent=$1
  local warning_threshold=70
  local critical_threshold=90

  if [ "$memory_percent" -ge "$critical_threshold" ]; then
    echo -e "${RED}CRITICAL${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] CRITICAL: Redis memory at ${memory_percent}%" >> "$LOG_DIR/alerts.txt"
    return 2
  elif [ "$memory_percent" -ge "$warning_threshold" ]; then
    echo -e "${YELLOW}WARNING${NC}"
    return 1
  else
    echo -e "${GREEN}OK${NC}"
    return 0
  fi
}

##############################################################################
# Function: Log Metrics
# Purpose: Save metrics to CSV and JSON
##############################################################################
log_metrics() {
  local timestamp=$(date '+%s')
  local iso_time=$(date '+%Y-%m-%dT%H:%M:%SZ')
  local memory_data="$1"  # Format: memory_mb|max_mb|memory_percent
  local key_count="$2"
  local db_size="$3"

  IFS='|' read -r memory_mb max_mb memory_percent <<< "$memory_data"

  # Append to CSV
  echo "$timestamp,$memory_mb,$max_mb,$memory_percent,$key_count,$db_size" >> "$REDIS_LOG"

  # Save to JSON for analysis
  cat >> "$REDIS_STATS_LOG" <<EOF
{
  "timestamp": "$iso_time",
  "memory_mb": $memory_mb,
  "max_mb": $max_mb,
  "memory_percent": $memory_percent,
  "key_count": $key_count,
  "db_size_mb": $db_size
},
EOF
}

##############################################################################
# Main Monitoring Loop
##############################################################################
main() {
  echo -e "${BLUE}Starting Redis Memory Monitor${NC}"
  echo "Log Directory: $LOG_DIR"
  echo "CSV Log: $REDIS_LOG"
  echo ""

  local iteration=0

  while true; do
    iteration=$((iteration + 1))
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo "[$timestamp] Iteration $iteration - Checking Redis..."

    # Get memory info
    if ! memory_data=$(get_redis_memory); then
      echo -e "${RED}[$timestamp] Failed to connect to Redis${NC}"
      sleep 60
      continue
    fi

    # Get additional metrics
    key_count=$(get_key_count)
    db_size=$(get_database_size)

    IFS='|' read -r memory_mb max_mb memory_percent <<< "$memory_data"

    # Log metrics
    log_metrics "$memory_data" "$key_count" "$db_size"

    # Print status
    echo "[$timestamp] Memory: ${memory_mb}MB / ${max_mb}MB (${memory_percent}%)"
    echo "[$timestamp] Keys: $key_count"
    echo "[$timestamp] DB Size: ${db_size}MB"

    # Check threshold
    local status=$(check_memory_threshold "$memory_percent")
    echo "[$timestamp] Status: $status"
    echo ""

    # Wait 60 seconds before next check
    sleep 60
  done
}

# Run main function
main
