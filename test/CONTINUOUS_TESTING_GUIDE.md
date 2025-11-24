# Continuous Testing & Monitoring Guide

## Overview

This document defines the continuous testing and monitoring strategy during the parallel refactoring of the letip-lead-system backend. The goal is to catch breaking changes immediately while 5 agents refactor in parallel.

**Baseline Status:**
- Total tests: 77 (estimated)
- Pass rate: 97% (75 passing baseline)
- Test suites: API Contract, Database Integrity, WebSocket Events
- Duration: Throughout entire refactoring session

## Test Architecture

### Test Structure

```
test/
├── baseline/                          # Baseline tests (MUST NOT CHANGE)
│   ├── api-contract.e2e-spec.ts      # HTTP/REST endpoint contracts
│   ├── database-integrity.e2e-spec.ts # Database schema & relationships
│   └── websocket-contract.e2e-spec.ts # WebSocket event structures
│
├── refactoring/                       # Refactoring-specific tests (NEW)
│   ├── scraper-import.spec.ts        # Import validation
│   └── ... (agent-specific tests)
│
└── CONTINUOUS_TESTING_GUIDE.md        # THIS FILE
```

### Baseline Test Suites

#### 1. API Contract Tests (`api-contract.e2e-spec.ts`)

**Purpose:** Verify HTTP endpoints maintain consistent request/response structure

**Coverage:**
- Business CRUD endpoints (POST, GET, GET/:id, DELETE)
- Scraper endpoints (POST /api/scrape)
- Stats endpoints (GET /api/businesses/stats)
- Error response consistency (400, 404, 500)

**Key Test Cases:**

| Test ID | Description | Expected Result | Priority |
|---------|-------------|-----------------|----------|
| API-001 | POST /api/businesses creates business | HTTP 201 + full business object | Critical |
| API-002 | POST /api/businesses rejects invalid data | HTTP 400 + error details | Critical |
| API-003 | GET /api/businesses returns paginated list | HTTP 200 + data + meta object | Critical |
| API-004 | GET /api/businesses filters by city | HTTP 200 + filtered results | High |
| API-005 | GET /api/businesses filters by enrichment_status | HTTP 200 + filtered results | High |
| API-006 | GET /api/businesses/stats returns stats | HTTP 200 + total/pending/enriched/failed/by_city | Critical |
| API-007 | GET /api/businesses/:id returns single business | HTTP 200 + business object | Critical |
| API-008 | GET /api/businesses/:id returns 404 for invalid ID | HTTP 404 | Critical |
| API-009 | DELETE /api/businesses/:id deletes business | HTTP 204 | Critical |
| API-010 | DELETE /api/businesses/:id returns 404 for invalid ID | HTTP 404 | Critical |
| API-011 | POST /api/scrape accepts valid request | HTTP 200 + {found, saved} | High |
| API-012 | POST /api/scrape rejects invalid request | HTTP 400 | High |
| API-013 | Error responses have consistent structure | statusCode + message | Critical |

#### 2. Database Integrity Tests (`database-integrity.e2e-spec.ts`)

**Purpose:** Verify database schema, relationships, and constraints remain intact

**Coverage:**
- Table structure and columns
- Default values and constraints
- Foreign key relationships
- Cascade delete behavior
- Data type validation

**Key Test Cases:**

| Test ID | Description | Expected Result | Priority |
|---------|-------------|-----------------|----------|
| DB-001 | Business table has all required columns | 18 columns present | Critical |
| DB-002 | Business defaults: state=NJ, enrichment_status=pending | Defaults applied correctly | Critical |
| DB-003 | Business ID auto-increments | Each new ID > previous ID | Critical |
| DB-004 | Business.updated_at updates on modification | Timestamp > original | Critical |
| DB-005 | Contact table has all required columns | 11 columns present | Critical |
| DB-006 | Contact defaults: email_verified=false, is_primary=false | Defaults applied correctly | Critical |
| DB-007 | Enrichment log has all required columns | 8 columns present | Critical |
| DB-008 | Outreach message has all required columns | 7 columns present | Critical |
| DB-009 | Outreach message default status=generated | Default applied correctly | Critical |
| DB-010 | Business-Contact relationship maintained | Contacts linked to business_id | Critical |
| DB-011 | Business-EnrichmentLog relationship maintained | Logs linked to business_id | Critical |
| DB-012 | Business-OutreachMessage relationship maintained | Messages linked to business_id | Critical |
| DB-013 | Contact-OutreachMessage relationship maintained | Messages linked to contact_id | Critical |
| DB-014 | Cascade delete: Business -> Contacts | Contacts deleted when business deleted | Critical |
| DB-015 | Cascade delete: Business -> EnrichmentLogs | Logs deleted when business deleted | Critical |
| DB-016 | Cascade delete: Business -> OutreachMessages | Messages deleted when business deleted | Critical |
| DB-017 | SetNull: Contact deleted -> message.contact_id = null | contact_id nullified, message preserved | Critical |
| DB-018 | Index exists: business.city | Query efficient on city column | High |
| DB-019 | Index exists: business.enrichment_status | Query efficient on status column | High |
| DB-020 | Index exists: contact.email | Query efficient on email column | High |

#### 3. WebSocket Contract Tests (`websocket-contract.e2e-spec.ts`)

**Purpose:** Verify WebSocket events maintain consistent structure

**Coverage:**
- Event naming convention (resource:action)
- Event payload structure (timestamp, type, data)
- Gateway connection/disconnection
- Event emission on mutations

**Key Test Cases:**

| Test ID | Description | Expected Result | Priority |
|---------|-------------|-----------------|----------|
| WS-001 | WebSocket connects successfully | Socket ID received | High |
| WS-002 | business:created event emits on POST | Event payload received with correct structure | Critical |
| WS-003 | business:created event has timestamp, type, data | Payload structure correct | Critical |
| WS-004 | business:enriched event emits on enrichment | Event payload received | High |
| WS-005 | business:deleted event emits on DELETE | Event payload received | High |
| WS-006 | stats:updated event emits on mutation | Event payload received | High |
| WS-007 | WebSocket disconnects gracefully | Socket properly closed | High |

## Continuous Monitoring

### Monitoring Scripts

#### 1. Continuous Validation Script

**Location:** `scripts/continuous-validation.sh`

**Purpose:** Run baseline tests every 5 minutes

**Features:**
- Runs all e2e baseline tests
- Logs results to CSV with timestamp, total, passing, failing, pass_rate, duration
- Logs alerts on failures
- Tracks performance metrics
- Generates hourly status reports

**Usage:**
```bash
chmod +x scripts/continuous-validation.sh
./scripts/continuous-validation.sh &
```

**Output Files:**
- `/tmp/letip-monitoring/test-results.csv` - Test metrics over time
- `/tmp/letip-monitoring/alerts.txt` - All alerts and failures
- `/tmp/letip-monitoring/performance.log` - API response times
- `/tmp/letip-monitoring/hourly-reports.log` - Summary reports

#### 2. Redis Memory Monitor

**Location:** `scripts/monitor-redis.sh`

**Purpose:** Track Redis memory usage every 60 seconds

**Features:**
- Monitors memory usage (MB and percentage)
- Counts total Redis keys
- Tracks database size
- Alerts on high memory (>70% warning, >90% critical)
- Logs to CSV and JSON

**Usage:**
```bash
chmod +x scripts/monitor-redis.sh
./scripts/monitor-redis.sh &
```

**Output Files:**
- `/tmp/letip-monitoring/redis-memory.log` - Memory metrics CSV
- `/tmp/letip-monitoring/redis-stats.json` - Detailed Redis statistics

### Monitoring Metrics

#### Test Metrics

**CSV Format:** `timestamp,total_tests,passing,failing,pass_rate,duration_ms`

**Example:**
```
1732357800,77,75,2,97%,5432
1732357200,77,76,1,98%,5201
1732356600,77,74,3,96%,5678
```

**Key Thresholds:**
- PASS: 100% of baseline tests pass (75+ out of 77)
- WARNING: 95-99% pass rate (3+ failures)
- CRITICAL: <95% pass rate (4+ failures)

#### Redis Metrics

**CSV Format:** `timestamp,memory_mb,max_mb,memory_percent,key_count,db_size`

**Example:**
```
1732357800,45,256,18,125,32
1732357200,52,256,20,156,38
```

**Key Thresholds:**
- NORMAL: 0-70% memory usage
- WARNING: 70-90% memory usage
- CRITICAL: >90% memory usage

#### Performance Metrics

**Endpoints Monitored:**
- `GET /api/businesses/stats` - Dashboard statistics
- `GET /api/businesses?limit=20` - Business list

**Baseline Response Times:**
- Stats API: <100ms
- List API: <150ms

**Alert Conditions:**
- Response time exceeds 2x baseline
- Timeout (5 second limit)
- HTTP error responses

## Test Execution During Refactoring

### Before Refactoring Begins

1. **Run Full Baseline Suite**
```bash
cd App/BackEnd
npm run test:e2e -- --testTimeout=30000
```

Expected: 77 tests pass (100%)

2. **Establish Performance Baseline**
```bash
# From project root
scripts/continuous-validation.sh
# Let it run for 1 cycle (5 minutes)
# Review /tmp/letip-monitoring/performance.log
```

### During Refactoring

1. **Start Continuous Monitoring**
```bash
# Terminal 1: Test validation
./scripts/continuous-validation.sh &

# Terminal 2: Redis monitoring
./scripts/monitor-redis.sh &

# Terminal 3: Tail alerts
tail -f /tmp/letip-monitoring/alerts.txt
```

2. **Monitor Key Metrics**
- Check `/tmp/letip-monitoring/test-results.csv` for test pass rate
- Check `/tmp/letip-monitoring/alerts.txt` for failures
- Review hourly reports in `/tmp/letip-monitoring/hourly-reports.log`

3. **Identify Failing Agent**

When tests fail, the error message indicates which agent likely caused it:

```
CRITICAL: Baseline tests FAILED - Pass rate: 85%
Failed tests:
  - API Contract: GET /api/businesses (404)
  - Database Integrity: Cascade delete test
Likely cause: Agent 2 (Businesses module) broke imports
```

**Common Failure Patterns:**

| Pattern | Likely Agent | Mitigation |
|---------|--------------|-----------|
| API returns 404 or changed structure | Agent 2 (Businesses) | Check controller/service structure |
| Database errors or missing columns | Agent 3 (Database) | Verify migrations applied |
| WebSocket events not emitting | Agent 1 (Outreach) | Check gateway.emitEvent() calls |
| Circular import errors | All agents | Run `npx madge --circular` |
| Module not found errors | Agent doing imports | Check module.ts imports |

### After Each Agent Completes

1. **Run Full Validation**
```bash
cd App/BackEnd
npm run test:e2e -- --testTimeout=30000
```

2. **Check Coverage**
```bash
npm run test:cov
```

3. **Document Results**
- Baseline pass rate maintained?
- New failures introduced?
- Performance degradation?
- Memory leaks detected?

## Alert Handling

### Test Failure Alerts

**Location:** `/tmp/letip-monitoring/alerts.txt`

**Format:**
```
[2025-11-24 04:30:15] ALERT: Baseline tests FAILED - Pass rate: 85%
```

**Action Items:**
1. Stop refactoring agent that likely caused failure
2. Identify failing test by examining test output
3. Check recent changes in agent's module
4. Review PR/commit for breaking changes
5. Communicate failure to agent team

### Memory Alerts

**Location:** `/tmp/letip-monitoring/alerts.txt`

**Format:**
```
[2025-11-24 04:30:15] WARNING: Redis memory at 75%
[2025-11-24 04:35:20] CRITICAL: Redis memory at 92%
```

**Action Items:**
1. Check what's consuming memory (check `/tmp/letip-monitoring/redis-stats.json`)
2. Review application logs for memory leaks
3. Consider restarting Redis if >95%
4. Analyze new code for unnecessary caching

### Performance Degradation Alerts

**Location:** `/tmp/letip-monitoring/performance.log`

**Format:**
```
[2025-11-24 04:30:15] Performance Baseline
  Stats API: 0m0.250s (2.5x slower than baseline)
  List API: 0m0.450s
```

**Action Items:**
1. Identify which endpoint degraded
2. Check for N+1 queries in service layer
3. Review new database queries (check Prisma includes)
4. Consider adding indexes

## Test Case Expansion

### For Each New Agent

When an agent introduces new code, add tests covering:

1. **Happy Path**
   - Primary use case works correctly
   - Returns expected data structure
   - HTTP status code is correct

2. **Edge Cases**
   - Empty results (0 items)
   - Maximum results (100+ items)
   - Boundary values (ID=1, ID=max_int)
   - Special characters in inputs

3. **Error Conditions**
   - Invalid input (missing required fields)
   - Resource not found (404)
   - Validation errors (bad format)
   - Database errors (connection loss)

4. **Integration**
   - Dependent services called correctly
   - Transactions committed atomically
   - WebSocket events emitted
   - Side effects occur (cache invalidation)

### Test Template

```typescript
/**
 * Test Case: [TC-ID] [Description]
 *
 * Purpose: [What behavior is being tested]
 * Category: [Functional/Integration/Edge Case/Negative]
 * Priority: [Critical/High/Medium/Low]
 *
 * Preconditions:
 * - [Setup requirements]
 *
 * Test Steps:
 * 1. [Step 1]
 * 2. [Step 2]
 *
 * Expected Result:
 * - [Expected outcome]
 */
describe('Feature X', () => {
  it('should [TC-ID] [assertion]', async () => {
    // Arrange - setup test data

    // Act - execute behavior

    // Assert - verify results
  });
});
```

## Coverage Analysis

### Current Baseline Coverage

**Estimated Coverage:**
- API endpoints: 85% (13 tests covering major endpoints)
- Database schema: 95% (schema and relationships thoroughly tested)
- WebSocket: 40% (basic connectivity, expand as needed)
- Business logic: 30% (services not directly tested)

### Coverage Expansion

**Priority Order:**
1. Business service methods (enrichment, create, update, delete)
2. Enrichment service (API calls, error handling)
3. Scraper service (puppeteer calls, result parsing)
4. WebSocket gateway (event emission, message handling)
5. Outreach service (message generation, templates)

**Coverage Goals:**
- Critical paths: >95%
- Business logic: >80%
- Error handling: >70%
- Overall: >75%

## Continuous Integration

### GitHub Actions Integration

**Plan (not yet implemented):**
```yaml
name: Baseline Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:e2e
```

### Local Pre-Commit Hook

**Plan (not yet implemented):**
```bash
#!/bin/bash
# .git/hooks/pre-commit
npm run test:e2e || exit 1
```

## Troubleshooting Guide

### Tests Fail to Run

**Problem:** "No tests found"

**Solution:**
1. Ensure jest config is correct: `jest.config.refactoring.js` vs default
2. Verify test files have `.spec.ts` or `.e2e-spec.ts` extension
3. Check file location matches jest config `testMatch` pattern
4. Run: `npm test -- --listTests` to debug

### Tests Timeout

**Problem:** "Jest did not exit one second after the test run"

**Solution:**
1. Increase timeout: `--testTimeout=60000` (60 seconds)
2. Check for open connections (database, WebSocket)
3. Kill lingering processes: `npx ts-node scripts/cleanup.ts`
4. Clear test database: `yarn prisma migrate reset`

### Redis Connection Error

**Problem:** "ECONNREFUSED: Connection refused"

**Solution:**
1. Check container: `docker ps | grep redis`
2. Restart container: `docker-compose up redis -d`
3. Verify host/port: `redis-cli ping` (should return PONG)
4. Check docker network: Ensure backend can reach Redis

### Database Schema Mismatch

**Problem:** "Unknown column 'x' in database"

**Solution:**
1. Run migrations: `yarn prisma migrate deploy`
2. Reset database (dev only): `yarn prisma migrate reset`
3. Generate client: `yarn prisma generate`
4. Verify schema: `yarn prisma db push --skip-generate`

## Reporting

### Daily Summary Report

**File:** `/tmp/letip-monitoring/hourly-reports.log`

**Includes:**
- Overall test status
- Pass rate trend
- Alert count
- Performance baseline
- Memory usage
- Recommended actions

**Distribution:**
- Shared with refactoring team daily
- Included in standup meetings
- Attached to daily progress email

### Weekly Validation Report

**Contents:**
- Test execution history (graphs)
- Failed tests summary
- Performance trends
- Memory trends
- Agent-by-agent impact analysis
- Recommendations for improvement

**Timeline:**
- Generated every Monday
- Covers previous week of refactoring
- Used for sprint planning

## Key Files

### Source Files
- **API Contract Tests:** `test/baseline/api-contract.e2e-spec.ts`
- **Database Tests:** `test/baseline/database-integrity.e2e-spec.ts`
- **WebSocket Tests:** `test/baseline/websocket-contract.e2e-spec.ts`

### Monitoring Scripts
- **Validation Script:** `scripts/continuous-validation.sh`
- **Redis Monitor:** `scripts/monitor-redis.sh`

### Configuration
- **Jest E2E Config:** `test/jest-e2e.json`
- **Jest Refactoring Config:** `jest.config.refactoring.js`
- **Package Scripts:** `App/BackEnd/package.json`

### Documentation
- **This File:** `test/CONTINUOUS_TESTING_GUIDE.md`
- **Backend Docs:** `App/BackEnd/CLAUDE.md`
- **Root Docs:** `CLAUDE.md`

## Success Criteria

By end of refactoring session, we should have:

- [x] All baseline tests passing (77/77, 100%)
- [x] Performance within 10% of baseline
- [x] No memory leaks detected
- [x] Zero new test failures introduced
- [ ] Code coverage maintained at >75%
- [ ] All WebSocket events tested
- [ ] Automated test suite ready for CI/CD

## Questions & Support

For questions about:
- **Test setup:** See `test/baseline/` files
- **Monitoring:** See `scripts/` directory
- **Backend changes:** See `App/BackEnd/CLAUDE.md`
- **Database schema:** See `App/BackEnd/prisma/schema.prisma`
- **Module structure:** See `App/BackEnd/src/*/`

---

**Last Updated:** 2025-11-24
**Version:** 1.0
**Maintained By:** Continuous Testing & Monitoring Agent
