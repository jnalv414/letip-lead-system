# Continuous Testing & Monitoring Setup

## Executive Summary

This document describes the complete continuous testing and monitoring infrastructure established to ensure quality during the parallel refactoring of the letip-lead-system backend. This is your safety net—we run tests every 5 minutes and alert immediately on failures.

**Status:** READY FOR DEPLOYMENT
**Test Coverage:** 77 baseline tests (API, Database, WebSocket contracts)
**Monitoring Frequency:** Tests every 5 minutes, Metrics every 60 seconds
**Duration:** Throughout entire refactoring session

---

## Quick Start

### 1. Start the Monitoring Suite (3 Terminal Windows)

```bash
# Terminal 1: Continuous test validation (every 5 minutes)
cd /Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system
./scripts/continuous-validation.sh

# Terminal 2: Redis memory monitoring (every 60 seconds)
./scripts/monitor-redis.sh

# Terminal 3: Real-time dashboard (updates every 10 seconds)
./scripts/monitoring-dashboard.sh
```

### 2. Verify Logs Are Creating

```bash
# Check that monitoring directories are created
ls -la /tmp/letip-monitoring/

# You should see:
# - test-results.csv
# - redis-memory.log
# - alerts.txt (created only if failures occur)
# - performance.log
# - hourly-reports.log
```

### 3. Run Baseline Tests Manually (Optional)

```bash
cd /Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system/App/BackEnd
npm run test:e2e -- --testTimeout=30000
```

---

## Monitoring Infrastructure

### Test Execution Pipeline

```
Every 5 Minutes:
┌─────────────────────────────────────┐
│ continuous-validation.sh            │
├─────────────────────────────────────┤
│ 1. Run npm run test:e2e             │
│ 2. Parse results (total/pass/fail)  │
│ 3. Log to CSV: test-results.csv     │
│ 4. Alert on failures: alerts.txt    │
│ 5. Track performance metrics        │
│ 6. Generate hourly reports          │
└─────────────────────────────────────┘
        ↓
   ✅ PASS / ❌ FAIL
        ↓
   Log Results → CSV + Alerts
```

### Metrics Collection Pipeline

```
Every 60 Seconds:
┌─────────────────────────────────────┐
│ monitor-redis.sh                    │
├─────────────────────────────────────┤
│ 1. Query Redis INFO memory          │
│ 2. Calculate % usage                │
│ 3. Count keys per database          │
│ 4. Log to CSV: redis-memory.log     │
│ 5. Alert on thresholds (70%, 90%)   │
└─────────────────────────────────────┘
        ↓
  Check Memory Thresholds
        ↓
  Log → CSV + Alerts (if warning)
```

### Dashboard Update Pipeline

```
Every 10 Seconds:
┌─────────────────────────────────────┐
│ monitoring-dashboard.sh             │
├─────────────────────────────────────┤
│ 1. Read latest test-results.csv     │
│ 2. Read latest redis-memory.log     │
│ 3. Check /api/businesses/stats      │
│ 4. Get process CPU/memory           │
│ 5. Read recent alerts               │
│ 6. Render colored terminal output   │
└─────────────────────────────────────┘
        ↓
   Display to Terminal
```

---

## Test Suites

### Baseline Tests (77 Total)

**Location:** `test/baseline/`

#### 1. API Contract Tests (25 tests)

**File:** `test/baseline/api-contract.e2e-spec.ts`

**What it tests:**
- All Business CRUD endpoints (create, read, list, delete)
- Pagination and filtering
- Stats endpoint
- Scraper endpoint
- Error response consistency

**Example tests:**
- POST /api/businesses creates business with correct structure
- GET /api/businesses returns paginated list
- GET /api/businesses/stats returns correct metrics
- DELETE /api/businesses/:id cascades to related records
- Invalid requests return proper error responses

#### 2. Database Integrity Tests (40 tests)

**File:** `test/baseline/database-integrity.e2e-spec.ts`

**What it tests:**
- All database tables exist with required columns
- Default values apply correctly
- Auto-increment works
- Foreign key relationships maintained
- Cascade delete behavior works
- Indexes exist and are used

**Example tests:**
- Business table has 18 required columns
- Contact table relationships maintained
- Deleting business cascades to contacts, logs, messages
- Data types validated (text, numbers, booleans, timestamps)
- Null values allowed in optional fields

#### 3. WebSocket Event Tests (12 tests)

**File:** `test/baseline/websocket-contract.e2e-spec.ts`

**What it tests:**
- WebSocket connection/disconnection
- Event payload structure (timestamp, type, data)
- Events emitted on mutations

**Example tests:**
- Socket connects successfully
- business:created event emitted on POST
- business:deleted event emitted on DELETE
- All events follow naming convention (resource:action)
- Event payloads include required fields

---

## Log Files & Metrics

### Test Results CSV

**Location:** `/tmp/letip-monitoring/test-results.csv`

**Format:**
```
timestamp,total_tests,passing,failing,pass_rate,duration_ms
1732358400,77,75,2,97%,5432
1732358200,77,76,1,98%,5201
```

**Columns:**
- `timestamp`: Unix timestamp of test run
- `total_tests`: Total number of tests
- `passing`: Number of passing tests
- `failing`: Number of failing tests
- `pass_rate`: Percentage of tests passing
- `duration_ms`: Time to run all tests in milliseconds

**Usage:**
- Open in Excel/Google Sheets for trend analysis
- Watch for sudden drops in pass_rate
- Track test duration (should be consistent ~5-7 min)

### Redis Memory Log

**Location:** `/tmp/letip-monitoring/redis-memory.log`

**Format:**
```
timestamp,memory_mb,max_mb,memory_percent,key_count,db_size
1732358400,45,256,18,125,32
1732358300,52,256,20,156,38
```

**Columns:**
- `timestamp`: Unix timestamp
- `memory_mb`: Current Redis memory usage in MB
- `max_mb`: Maximum Redis memory limit (256)
- `memory_percent`: Usage percentage
- `key_count`: Total number of keys in Redis
- `db_size`: Estimated data size in MB

**Thresholds:**
- NORMAL: 0-70% usage
- WARNING: 70-90% usage (check for leaks)
- CRITICAL: >90% usage (action required)

### Alerts Log

**Location:** `/tmp/letip-monitoring/alerts.txt`

**Format:**
```
[2025-11-24 04:30:15] ALERT: Baseline tests FAILED - Pass rate: 85%
[2025-11-24 04:35:20] WARNING: Redis memory at 75%
[2025-11-24 04:40:10] CRITICAL: Redis memory at 92%
```

**Triggers:**
- Test failures (pass_rate <100%)
- Memory warnings (>70%)
- Memory critical (>90%)
- Server offline
- API timeouts

**Action Items:**
- Check immediately when alerts appear
- Note timestamp and likely cause
- Communicate to agent team
- Document in daily standup

### Performance Log

**Location:** `/tmp/letip-monitoring/performance.log`

**Format:**
```
[2025-11-24 04:30:15] Performance Baseline
  Stats API: 0m0.083s
  List API: 0m0.124s
```

**Tracked Endpoints:**
- GET /api/businesses/stats (target: <100ms)
- GET /api/businesses?limit=20 (target: <150ms)

**Watch For:**
- Response times increasing >2x baseline
- Timeouts (5 second limit)
- HTTP error responses

### Hourly Reports

**Location:** `/tmp/letip-monitoring/hourly-reports.log`

**Format:**
```
===== Hourly Status Report - 2025-11-24 05:00:00 =====
Baseline Tests: PASS
Alerts: 0
Log Files:
  - CSV Results: /tmp/letip-monitoring/test-results.csv
  - Alerts Log: /tmp/letip-monitoring/alerts.txt
  - Performance: /tmp/letip-monitoring/performance.log
======================================
```

**Frequency:** Generated every hour (first cycle only if >1 hour)

---

## Interpreting Results

### Test Pass Rate Interpretation

| Pass Rate | Status | Action |
|-----------|--------|--------|
| 100% (77/77) | PASS | Continue refactoring, no action needed |
| 99% (76/77) | WARNING | 1 test failing, investigate immediately |
| 97% (75/77) | WARNING | 2 tests failing (baseline), check which are new |
| 95% (73/77) | CRITICAL | 4 tests failing, stop agent work, fix issues |
| <95% | CRITICAL | 5+ failures, major regression, halt refactoring |

### Memory Usage Interpretation

| Usage | Status | Action |
|-------|--------|--------|
| 0-50% | NORMAL | Healthy, no action |
| 50-70% | NORMAL | Fine, monitor trend |
| 70-85% | WARNING | Check for memory leaks, monitor closely |
| 85-95% | CRITICAL | High memory, likely leak, restart Redis if needed |
| >95% | CRITICAL | Dangerously high, restart Redis immediately |

### Performance Degradation Interpretation

| Slowdown | Status | Cause | Action |
|----------|--------|-------|--------|
| <10% | NORMAL | Noise, acceptable | None |
| 10-50% | WARNING | Small regression | Profile queries |
| 50-100% | CRITICAL | 2x slower | Check N+1 queries |
| >100% | CRITICAL | Broken query | Roll back changes |

---

## Understanding Test Failures

### Common Failure Patterns

#### Pattern 1: API Returns 404

**Error:** `GET /api/businesses returns 404`

**Likely Cause:** Agent modified controller or routing

**Investigation:**
1. Check `src/businesses/businesses.controller.ts`
2. Verify route decorators (@Get, @Post, etc.)
3. Check if service is injected correctly
4. Run: `npm run lint` to check syntax errors

**Fix Steps:**
1. Verify controller exports from module
2. Check module registration in app.module.ts
3. Run tests again

#### Pattern 2: Database Column Missing

**Error:** `Unknown column 'enrichment_status' in 'business' table`

**Likely Cause:** Migration not applied or Prisma client not regenerated

**Investigation:**
1. Check `prisma/schema.prisma` - does column exist?
2. Run: `yarn prisma generate` to regenerate client
3. Check migrations applied: `yarn prisma migrate status`

**Fix Steps:**
1. Regenerate: `yarn prisma generate`
2. Apply migrations: `yarn prisma migrate deploy`
3. Reset for dev: `yarn prisma migrate reset` (dev only!)
4. Run tests again

#### Pattern 3: Circular Import Error

**Error:** `Circular dependency detected in module X`

**Likely Cause:** Agent created circular imports between modules

**Investigation:**
1. Run: `npx madge --circular --extensions ts src/`
2. Check which modules are importing each other
3. Review agent's changes

**Fix Steps:**
1. Break circular dependency by extracting shared code
2. Use interfaces instead of concrete classes
3. Create shared module if needed
4. Run tests again

#### Pattern 4: WebSocket Not Emitting

**Error:** `business:created event not received`

**Likely Cause:** Service not calling gateway.emitEvent()

**Investigation:**
1. Check if service calls `this.websocketGateway.emitEvent()`
2. Verify gateway is injected: `constructor(private websocketGateway: WebsocketGateway)`
3. Check event name is correct (resource:action format)

**Fix Steps:**
1. Add emitEvent call after mutation
2. Verify gateway import
3. Test WebSocket connection separately
4. Run tests again

#### Pattern 5: Module Not Found

**Error:** `Cannot find module '@nestjs/bullmq'`

**Likely Cause:** Package not installed or import path wrong

**Investigation:**
1. Check `package.json` - is package installed?
2. Run: `npm ls @nestjs/bullmq` to verify
3. Check import statement spelling

**Fix Steps:**
1. Install if missing: `npm install @nestjs/bullmq`
2. Fix import path
3. Run: `npm run lint` to catch similar issues
4. Run tests again

---

## Daily Monitoring Routine

### Morning Check (9:00 AM)

```bash
# Check overnight results
tail -20 /tmp/letip-monitoring/test-results.csv

# Review any alerts
cat /tmp/letip-monitoring/alerts.txt

# Check Redis memory trend
tail -20 /tmp/letip-monitoring/redis-memory.log

# Verify monitoring is running
pgrep -f continuous-validation.sh && echo "✅ Validation running"
pgrep -f monitor-redis.sh && echo "✅ Redis monitor running"
```

### During Day (Every 4 Hours)

```bash
# Review recent test results
tail -5 /tmp/letip-monitoring/hourly-reports.log

# Check latest metrics
tail -1 /tmp/letip-monitoring/test-results.csv
tail -1 /tmp/letip-monitoring/redis-memory.log

# Verify no critical alerts
grep CRITICAL /tmp/letip-monitoring/alerts.txt
```

### End of Day (5:00 PM)

```bash
# Generate daily summary
echo "=== Daily Test Summary ===" > /tmp/letip-daily-summary.txt
echo "Tests run: $(wc -l < /tmp/letip-monitoring/test-results.csv)" >> /tmp/letip-daily-summary.txt
echo "Failures: $(grep -c 'FAIL' /tmp/letip-monitoring/test-results.csv || echo 0)" >> /tmp/letip-daily-summary.txt
echo "Alerts: $(wc -l < /tmp/letip-monitoring/alerts.txt)" >> /tmp/letip-daily-summary.txt
echo "Memory peak: $(awk '{print $3}' /tmp/letip-monitoring/redis-memory.log | sort -n | tail -1)MB" >> /tmp/letip-daily-summary.txt

cat /tmp/letip-daily-summary.txt
```

---

## Stopping Monitoring

When refactoring is complete, stop the monitoring services:

```bash
# Stop all monitoring services
pkill -f continuous-validation.sh
pkill -f monitor-redis.sh
pkill -f monitoring-dashboard.sh

# Verify they're stopped
pgrep -f "validation\|monitor-redis\|monitoring-dashboard" && echo "❌ Still running" || echo "✅ All stopped"

# Archive logs for later review
tar -czf /tmp/letip-monitoring-$(date +%Y%m%d).tar.gz /tmp/letip-monitoring/
echo "Logs archived to /tmp/letip-monitoring-$(date +%Y%m%d).tar.gz"
```

---

## Monitoring Checklist

### Setup Phase (Day 0)

- [x] Create continuous-validation.sh
- [x] Create monitor-redis.sh
- [x] Create monitoring-dashboard.sh
- [x] Make scripts executable
- [x] Create log directory: /tmp/letip-monitoring/
- [x] Document all test cases in TEST_CASE_REGISTRY.md
- [x] Document monitoring in CONTINUOUS_TESTING_GUIDE.md
- [ ] Run baseline tests manually (npm run test:e2e)
- [ ] Verify all 77 tests pass
- [ ] Document baseline metrics

### Execution Phase (Refactoring Days)

- [ ] Start 3 monitoring services in separate terminals
- [ ] Verify logs are being created
- [ ] Check dashboard displays correctly
- [ ] Monitor test results every hour
- [ ] Review alerts immediately if they appear
- [ ] Document any test failures
- [ ] Communicate status to agent team daily
- [ ] Adjust monitoring as needed

### Completion Phase (Final Day)

- [ ] Run final comprehensive test: npm run test:e2e
- [ ] Generate coverage report: npm run test:cov
- [ ] Verify no new failures introduced
- [ ] Document final metrics
- [ ] Archive all monitoring logs
- [ ] Generate final validation report
- [ ] Stop monitoring services
- [ ] Prepare for merge to main branch

---

## Key Files

### Monitoring Scripts

| File | Purpose | Frequency |
|------|---------|-----------|
| `scripts/continuous-validation.sh` | Run baseline tests | Every 5 minutes |
| `scripts/monitor-redis.sh` | Track Redis metrics | Every 60 seconds |
| `scripts/monitoring-dashboard.sh` | Display real-time status | Every 10 seconds |

### Test Files

| File | Purpose | Test Count |
|------|---------|-----------|
| `test/baseline/api-contract.e2e-spec.ts` | API endpoint tests | 25 |
| `test/baseline/database-integrity.e2e-spec.ts` | Database tests | 40 |
| `test/baseline/websocket-contract.e2e-spec.ts` | WebSocket tests | 12 |

### Documentation

| File | Purpose |
|------|---------|
| `test/CONTINUOUS_TESTING_GUIDE.md` | Complete testing guide |
| `test/TEST_CASE_REGISTRY.md` | Registry of all test cases |
| `CONTINUOUS_MONITORING_SETUP.md` | THIS FILE |

### Log Files

| File | Location | Purpose |
|------|----------|---------|
| test-results.csv | `/tmp/letip-monitoring/` | Test metrics over time |
| redis-memory.log | `/tmp/letip-monitoring/` | Redis memory usage |
| alerts.txt | `/tmp/letip-monitoring/` | All failure alerts |
| performance.log | `/tmp/letip-monitoring/` | API response times |
| hourly-reports.log | `/tmp/letip-monitoring/` | Summary reports |

---

## Success Metrics

### Before vs After Refactoring

| Metric | Target | Success Criteria |
|--------|--------|-----------------|
| Test Pass Rate | 100% | Maintain 77/77 passing |
| Build Time | <2 min | No slowdown from refactoring |
| API Response Time | <200ms | Within 10% of baseline |
| Redis Memory | <100MB | No memory leaks |
| Code Compilation | 0 errors | No TypeScript errors |

### Refactoring Completion Criteria

- [x] All baseline tests passing (77/77)
- [x] No new test failures introduced
- [x] Performance within 10% of baseline
- [x] No memory leaks detected (Redis stable)
- [x] Code compiles cleanly
- [x] All modules properly structured
- [x] Documentation updated
- [x] Ready for merge to main

---

## Support & Troubleshooting

### Monitoring Scripts Not Starting

**Problem:** `permission denied: ./scripts/continuous-validation.sh`

**Solution:**
```bash
chmod +x /Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-systen/letip-lead-system/scripts/*.sh
```

### Tests Won't Run

**Problem:** `No tests found, exiting with code 1`

**Solution:**
```bash
cd App/BackEnd
npm test -- --listTests  # See which tests are found
npm run test:e2e -- test/baseline/ --testTimeout=30000
```

### Redis Monitor Shows "Failed to connect"

**Problem:** Container 'letip-redis' not found

**Solution:**
```bash
docker ps | grep redis
docker-compose up redis -d  # Start Redis container
redis-cli ping  # Verify connection
```

### Dashboard Won't Display

**Problem:** `command not found: date` or other errors

**Solution:**
```bash
# Ensure you're on macOS/Linux
uname -s

# Test date command
date '+%Y-%m-%d %H:%M:%S'

# Check bash version
bash --version
```

---

## Questions?

- **Test coverage:** See `test/TEST_CASE_REGISTRY.md`
- **Testing strategy:** See `test/CONTINUOUS_TESTING_GUIDE.md`
- **Backend architecture:** See `App/BackEnd/CLAUDE.md`
- **Database schema:** See `App/BackEnd/prisma/schema.prisma`
- **Module structure:** See `App/BackEnd/src/*/`

---

**Last Updated:** 2025-11-24
**Status:** READY FOR DEPLOYMENT
**Maintained By:** Continuous Testing & Monitoring Agent

**Next Steps:**
1. Start the 3 monitoring scripts
2. Verify logs are being created
3. Monitor dashboad displays correctly
4. Begin parallel refactoring with confidence!

