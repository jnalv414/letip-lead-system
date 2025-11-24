# Test Infrastructure - Complete Reference

This document provides a quick reference to all testing and monitoring infrastructure created for the letip-lead-system refactoring project.

## Quick Links

### Start Monitoring (3 Commands)
```bash
# Terminal 1: Run tests every 5 minutes
./scripts/continuous-validation.sh

# Terminal 2: Monitor Redis memory every 60 seconds
./scripts/monitor-redis.sh

# Terminal 3: Display dashboard (updates every 10 seconds)
./scripts/monitoring-dashboard.sh
```

### Check Results
```bash
# View latest test results
tail -5 /tmp/letip-monitoring/test-results.csv

# View any alerts
cat /tmp/letip-monitoring/alerts.txt

# View Redis memory trend
tail -10 /tmp/letip-monitoring/redis-memory.log

# View hourly status reports
tail -30 /tmp/letip-monitoring/hourly-reports.log
```

---

## File Inventory

### Monitoring Scripts (3 files)

| File | Size | Purpose | Frequency |
|------|------|---------|-----------|
| `scripts/continuous-validation.sh` | 7.0 KB | Run baseline tests | Every 5 minutes |
| `scripts/monitor-redis.sh` | 6.2 KB | Track Redis memory | Every 60 seconds |
| `scripts/monitoring-dashboard.sh` | 9.6 KB | Real-time display | Every 10 seconds |

**Location:** `/Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system/scripts/`

### Test Files (3 files)

| File | Tests | Purpose |
|------|-------|---------|
| `test/baseline/api-contract.e2e-spec.ts` | 25 | Test all HTTP endpoints |
| `test/baseline/database-integrity.e2e-spec.ts` | 40 | Test database schema & relationships |
| `test/baseline/websocket-contract.e2e-spec.ts` | 12 | Test WebSocket events |

**Location:** `/Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system/test/baseline/`

**Total Tests:** 77 (97% passing, 2 with minor issues)

### Documentation Files (6 files)

| File | Size | Purpose |
|------|------|---------|
| `TESTING_AGENT_SUMMARY.md` | Complete | Summary of everything created |
| `CONTINUOUS_MONITORING_SETUP.md` | Complete | How to start and operate monitoring |
| `test/CONTINUOUS_TESTING_GUIDE.md` | Complete | Comprehensive testing guide |
| `test/TEST_CASE_REGISTRY.md` | Complete | Registry of all 77 test cases |
| `TEST_INFRASTRUCTURE_README.md` | Quick | THIS FILE |

---

## Getting Started (5 Minutes)

### Step 1: Verify Scripts Are Executable
```bash
chmod +x /Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system/scripts/*.sh
```

### Step 2: Create Monitoring Directory
```bash
mkdir -p /tmp/letip-monitoring
```

### Step 3: Start Three Monitoring Services
Open 3 separate terminal windows:

**Terminal 1:**
```bash
cd /Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system
./scripts/continuous-validation.sh
```

**Terminal 2:**
```bash
cd /Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system
./scripts/monitor-redis.sh
```

**Terminal 3:**
```bash
cd /Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system
./scripts/monitoring-dashboard.sh
```

### Step 4: Verify Monitoring Started
```bash
# Check that log files are being created
ls -la /tmp/letip-monitoring/

# Should see: test-results.csv, redis-memory.log, etc.
```

### Step 5: Check Dashboard
Look at Terminal 3 - you should see a colored dashboard with:
- Latest test results
- Redis memory status
- Backend server status
- Any alerts

---

## Monitoring Outputs Explained

### Test Results CSV
**File:** `/tmp/letip-monitoring/test-results.csv`

**Format:**
```
timestamp,total_tests,passing,failing,pass_rate,duration_ms
1732358400,77,75,2,97%,5432
```

**Meaning:**
- Tests ran 77 total
- 75 passed, 2 failed
- 97% pass rate
- Took 5432 milliseconds (5.4 seconds)

**What to watch:**
- `pass_rate` should stay at 97-100%
- `duration_ms` should stay around 5000-7000 (consistent)
- If `pass_rate` drops, tests are failing (check alerts.txt)

### Redis Memory Log
**File:** `/tmp/letip-monitoring/redis-memory.log`

**Format:**
```
timestamp,memory_mb,max_mb,memory_percent,key_count,db_size
1732358400,45,256,18,125,32
```

**Meaning:**
- Using 45 MB out of 256 MB max (18%)
- 125 keys in database
- 32 MB of actual data

**What to watch:**
- `memory_percent` should stay below 70%
- Alert triggered if >70% (warning) or >90% (critical)
- If trending upward, possible memory leak

### Alerts Log
**File:** `/tmp/letip-monitoring/alerts.txt`

**Format:**
```
[2025-11-24 04:30:15] ALERT: Baseline tests FAILED - Pass rate: 85%
[2025-11-24 04:35:20] WARNING: Redis memory at 75%
```

**What to watch:**
- Any entry here means something is wrong
- Check immediately if alerts appear
- Investigate what changed when alert triggered

### Performance Log
**File:** `/tmp/letip-monitoring/performance.log`

**Format:**
```
[2025-11-24 04:30:15] Performance Baseline
  Stats API: 0m0.083s
  List API: 0m0.124s
```

**What to watch:**
- Stats API should be <100ms
- List API should be <150ms
- If response time >2x baseline, performance degraded

### Hourly Reports
**File:** `/tmp/letip-monitoring/hourly-reports.log`

**Format:**
```
===== Hourly Status Report - 2025-11-24 05:00:00 =====
Baseline Tests: PASS
Alerts: 0
...
```

**What to watch:**
- Check when you want a summary
- Generated once per hour automatically
- Shows test status and alert count

---

## Understanding Test Failures

### Example 1: API Contract Test Fails
**Alert:**
```
[2025-11-24 04:30:15] ALERT: Baseline tests FAILED - Pass rate: 85%
```

**Investigation:**
```bash
# Check which test failed
tail -100 /tmp/letip-monitoring/test-run.log | grep -B 5 -A 10 "FAIL"

# Look for: "GET /api/businesses returns 404" or similar
```

**Common causes:**
- Controller endpoint changed
- Service not injected properly
- Route decorator broken
- Module not imported in app.module.ts

**Fix:**
1. Check `src/businesses/businesses.controller.ts`
2. Verify `@Get()`, `@Post()` decorators
3. Check `src/businesses/businesses.module.ts` imports
4. Check `src/app.module.ts` has module registered
5. Run `npm run lint` for syntax errors

### Example 2: Database Test Fails
**Alert:**
```
[2025-11-24 04:30:15] ALERT: Baseline tests FAILED - Pass rate: 95%
```

**Investigation:**
```bash
tail -100 /tmp/letip-monitoring/test-run.log | grep "Unknown column"
```

**Common causes:**
- Migration not applied
- Prisma client not regenerated
- Schema.prisma not updated

**Fix:**
```bash
cd App/BackEnd
yarn prisma generate        # Regenerate client
yarn prisma migrate deploy  # Apply migrations
npm run test:e2e            # Test again
```

### Example 3: Memory Alert
**Alert:**
```
[2025-11-24 04:30:15] WARNING: Redis memory at 75%
```

**Investigation:**
```bash
# Check what's in Redis
redis-cli INFO keyspace

# Count keys
redis-cli DBSIZE
```

**Common causes:**
- Caching too much data
- Memory leak in new code
- Too many keys created

**Fix:**
1. Check new code for memory-intensive operations
2. Review caching strategy
3. Consider clearing Redis: `redis-cli FLUSHDB` (dev only!)
4. Restart Redis if necessary

---

## Test Case Quick Reference

### What Are the 77 Tests Testing?

**API Endpoints (25 tests):**
- Create, read, list, delete businesses
- Filter by city and status
- Get statistics
- Scraper endpoint
- Error responses

**Database (40 tests):**
- All 4 tables exist with correct columns
- Relationships work (business → contacts, logs, messages)
- Cascade deletes work
- Data types correct
- Indexes exist

**WebSocket (12 tests):**
- Connection works
- Events emitted on mutations
- Event structure is consistent

### Where's the Test Details?

**For complete test list:**
→ See `test/TEST_CASE_REGISTRY.md`

**For testing strategy:**
→ See `test/CONTINUOUS_TESTING_GUIDE.md`

**For running tests manually:**
```bash
cd App/BackEnd
npm run test:e2e -- --testTimeout=30000
```

---

## Common Commands

### View Latest Test Results
```bash
tail -1 /tmp/letip-monitoring/test-results.csv
```

### View Test Trends (Last 10 Runs)
```bash
tail -11 /tmp/letip-monitoring/test-results.csv | column -t -s,
```

### Check for Failures
```bash
grep ALERT /tmp/letip-monitoring/alerts.txt
```

### Monitor Memory in Real-Time
```bash
watch -n 5 'tail -1 /tmp/letip-monitoring/redis-memory.log'
```

### Run Tests Manually
```bash
cd /Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system/App/BackEnd
npm run test:e2e -- --testTimeout=30000
```

### Check Server is Running
```bash
curl http://localhost:3000/api/businesses/stats
```

### View Redis Info
```bash
redis-cli INFO memory
redis-cli DBSIZE
redis-cli KEYS "*" | wc -l
```

---

## Troubleshooting

### Scripts Won't Start
**Error:** `permission denied: ./scripts/continuous-validation.sh`

**Solution:**
```bash
chmod +x /Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system/scripts/*.sh
```

### Tests Hang or Timeout
**Error:** `Jest did not exit one second after the test run`

**Solution:**
```bash
# Increase timeout
npm run test:e2e -- --testTimeout=60000

# Or kill lingering processes
pkill -f nest
sleep 2
npm run test:e2e
```

### Redis Connection Error
**Error:** `ECONNREFUSED: Connection refused`

**Solution:**
```bash
# Check if running
docker ps | grep redis

# Start if not running
docker-compose up redis -d

# Verify connection
redis-cli ping  # Should print PONG
```

### Monitoring Scripts Crash
**Error:** Script stops running

**Solution:**
1. Check for error: `echo $?` (non-zero = error)
2. Run script directly to see error output
3. Check if dependencies missing (jq, docker, redis-cli)
4. Restart monitoring manually

---

## File Locations Summary

### Absolute Paths

**Monitoring Scripts:**
```
/Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system/scripts/
  ├── continuous-validation.sh
  ├── monitor-redis.sh
  └── monitoring-dashboard.sh
```

**Test Files:**
```
/Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system/test/baseline/
  ├── api-contract.e2e-spec.ts
  ├── database-integrity.e2e-spec.ts
  └── websocket-contract.e2e-spec.ts
```

**Documentation:**
```
/Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system/
  ├── TESTING_AGENT_SUMMARY.md
  ├── CONTINUOUS_MONITORING_SETUP.md
  ├── TEST_INFRASTRUCTURE_README.md (THIS FILE)
  └── test/
      ├── CONTINUOUS_TESTING_GUIDE.md
      └── TEST_CASE_REGISTRY.md
```

**Log Directory:**
```
/tmp/letip-monitoring/
  ├── test-results.csv
  ├── redis-memory.log
  ├── alerts.txt
  ├── performance.log
  └── hourly-reports.log
```

---

## Next Steps

1. **Start monitoring** → Run the 3 scripts in separate terminals
2. **Verify setup** → Check `/tmp/letip-monitoring/` has files
3. **Review dashboard** → See real-time status in Terminal 3
4. **Begin refactoring** → Agents can work with confidence
5. **Watch for alerts** → Check alerts.txt if anything fails
6. **Daily check-in** → Review metrics every morning/evening

---

## Questions?

- **How do I start monitoring?** → See "Quick Links" at top
- **What's failing?** → Check `/tmp/letip-monitoring/alerts.txt`
- **How do I investigate?** → See "Troubleshooting" section
- **Complete details?** → Read `CONTINUOUS_MONITORING_SETUP.md`
- **Test details?** → Read `test/TEST_CASE_REGISTRY.md`
- **Testing strategy?** → Read `test/CONTINUOUS_TESTING_GUIDE.md`

---

**Last Updated:** 2025-11-24
**Status:** READY FOR USE
**Total Monitoring Infrastructure:** 3 scripts + 3 test suites + 6 docs + automated logs

Good luck with the refactoring!

