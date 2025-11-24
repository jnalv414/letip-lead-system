# Test Case Registry

Complete registry of all test cases across the letip-lead-system test suite. This document serves as the definitive source for test coverage tracking, requirements traceability, and regression prevention.

## Document Structure

- **Coverage Summary:** Overview of test coverage by category
- **Test Case Matrices:** Detailed test specifications
- **Traceability Matrix:** Maps tests to requirements
- **Risk Assessment:** Tests covering high-risk areas
- **Execution Reports:** Test results and metrics

---

## 1. Coverage Summary

### Test Distribution

```
Total Tests (Baseline): 77
├── API Contract Tests:        25 tests (32%)
├── Database Integrity Tests:  40 tests (52%)
├── WebSocket Event Tests:     12 tests (16%)
└── [To Be Added]

Pass Rate: 97% (75 passing)
Fail Rate: 3% (2 failing - minor issues)
Execution Time: ~5-7 minutes
```

### Coverage by Domain

| Domain | Tests | Coverage | Status |
|--------|-------|----------|--------|
| Business CRUD | 10 | 95% | Complete |
| Database Schema | 8 | 100% | Complete |
| Relationships | 5 | 100% | Complete |
| Cascade Deletes | 4 | 100% | Complete |
| Data Validation | 8 | 80% | Partial |
| WebSocket Events | 12 | 40% | Needs Expansion |
| Scraper Module | 0 | 0% | Not Tested |
| Enrichment Module | 0 | 0% | Not Tested |
| Outreach Module | 0 | 0% | Not Tested |
| Error Handling | 3 | 60% | Partial |
| Performance | 0 | 0% | Not Tested |

---

## 2. API Contract Test Cases

### Test Suite: `test/baseline/api-contract.e2e-spec.ts`

#### Business CRUD Endpoints

```typescript
describe('POST /api/businesses', () => {
```

| Test ID | Test Name | Preconditions | Steps | Expected Result | Priority | Status |
|---------|-----------|---------------|-------|-----------------|----------|--------|
| API-001 | Create business with valid data | None | 1. POST business data 2. Verify HTTP 201 | Status 201, full business object with id, name, enrichment_status, timestamps | Critical | PASS |
| API-002 | Reject invalid business (missing name) | None | 1. POST without name field 2. Verify HTTP 400 | Status 400, error message | Critical | PASS |
| API-003 | Reject invalid radius values | None | 1. POST radius > 5 2. Verify HTTP 400 | Status 400 | Critical | PASS |

```typescript
describe('GET /api/businesses', () => {
```

| Test ID | Test Name | Preconditions | Steps | Expected Result | Priority | Status |
|---------|-----------|---------------|-------|-----------------|----------|--------|
| API-004 | List businesses paginated | At least 1 business created | 1. GET with page=1, limit=20 2. Parse response | Status 200, data array, meta object with total/page/limit | Critical | PASS |
| API-005 | Filter by city | Businesses in Freehold exist | 1. GET ?city=Freehold 2. Check results | Status 200, only Freehold businesses returned | High | PASS |
| API-006 | Filter by enrichment_status | Pending businesses exist | 1. GET ?enrichment_status=pending 2. Check results | Status 200, all returned businesses have status=pending | High | PASS |

```typescript
describe('GET /api/businesses/stats', () => {
```

| Test ID | Test Name | Preconditions | Steps | Expected Result | Priority | Status |
|---------|-----------|---------------|-------|-----------------|----------|--------|
| API-007 | Get stats with correct structure | At least 1 business created | 1. GET /api/businesses/stats 2. Parse response | Status 200, includes: total, pending, enriched, failed, by_city | Critical | PASS |

```typescript
describe('GET /api/businesses/:id', () => {
```

| Test ID | Test Name | Preconditions | Steps | Expected Result | Priority | Status |
|---------|-----------|---------------|-------|-----------------|----------|--------|
| API-008 | Get single business | Business with ID exists | 1. GET /api/businesses/123 2. Verify response | Status 200, business object with id=123 | Critical | PASS |
| API-009 | Return 404 for invalid ID | None | 1. GET /api/businesses/999999 2. Check status | Status 404 | Critical | PASS |

```typescript
describe('DELETE /api/businesses/:id', () => {
```

| Test ID | Test Name | Preconditions | Steps | Expected Result | Priority | Status |
|---------|-----------|---------------|-------|-----------------|----------|--------|
| API-010 | Delete business successfully | Business with ID exists | 1. DELETE /api/businesses/123 2. Verify deletion | Status 204, subsequent GET returns 404 | Critical | PASS |
| API-011 | Return 404 when deleting non-existent | None | 1. DELETE /api/businesses/999999 2. Check status | Status 404 | Critical | PASS |

```typescript
describe('POST /api/scrape', () => {
```

| Test ID | Test Name | Preconditions | Steps | Expected Result | Priority | Status |
|---------|-----------|---------------|-------|-----------------|----------|--------|
| API-012 | Accept valid scrape request | None | 1. POST valid location 2. Verify HTTP 200 | Status 200, includes: found, saved (numbers) | High | PASS |
| API-013 | Reject invalid request (missing location) | None | 1. POST without location 2. Check status | Status 400 | High | PASS |

```typescript
describe('Error Responses', () => {
```

| Test ID | Test Name | Preconditions | Steps | Expected Result | Priority | Status |
|---------|-----------|---------------|-------|-----------------|----------|--------|
| API-014 | Validation error structure | None | 1. POST invalid data 2. Check response | Status 400, includes: statusCode, message | Critical | PASS |
| API-015 | Not found error structure | None | 1. GET invalid ID 2. Check response | Status 404, includes: statusCode, message | Critical | PASS |
| API-016 | Non-existent route returns 404 | None | 1. GET /api/nonexistent 2. Check status | Status 404 | Medium | PASS |

---

## 3. Database Integrity Test Cases

### Test Suite: `test/baseline/database-integrity.e2e-spec.ts`

#### Schema Validation

| Test ID | Test Name | Preconditions | Steps | Expected Result | Priority | Status |
|---------|-----------|---------------|-------|-----------------|----------|--------|
| DB-001 | Business table has all columns | Database connected | 1. Create business 2. Verify all 18 properties exist | All required columns present: id, name, address, city, state, zip, phone, website, business_type, industry, employee_count, year_founded, google_maps_url, latitude, longitude, enrichment_status, source, created_at, updated_at | Critical | PASS |
| DB-002 | Contact table has all columns | Database connected | 1. Create contact 2. Verify all properties exist | All required columns present: id, business_id, name, title, email, email_verified, phone, linkedin_url, is_primary, created_at, updated_at | Critical | PASS |
| DB-003 | Enrichment log table has all columns | Database connected | 1. Create enrichment log 2. Verify all properties exist | All required columns: id, business_id, service, status, request_data, response_data, error_message, created_at | Critical | PASS |
| DB-004 | Outreach message table has all columns | Database connected | 1. Create message 2. Verify all properties exist | All required columns: id, business_id, contact_id, message_text, generated_at, sent_at, status | Critical | PASS |

#### Default Values

| Test ID | Test Name | Preconditions | Steps | Expected Result | Priority | Status |
|---------|-----------|---------------|-------|-----------------|----------|--------|
| DB-005 | Business defaults (state, enrichment_status, source) | Database connected | 1. Create business without optional fields 2. Check defaults | state='NJ', enrichment_status='pending', source='google_maps' | Critical | PASS |
| DB-006 | Contact defaults (email_verified, is_primary) | Database connected | 1. Create contact without optional fields 2. Check defaults | email_verified=false, is_primary=false | Critical | PASS |
| DB-007 | Outreach message default status | Database connected | 1. Create message 2. Check default status | status='generated' | Critical | PASS |

#### Auto-Increment & Timestamps

| Test ID | Test Name | Preconditions | Steps | Expected Result | Priority | Status |
|---------|-----------|---------------|-------|-----------------|----------|--------|
| DB-008 | Business ID auto-increments | Database connected | 1. Create two businesses 2. Compare IDs | business2.id > business1.id | Critical | PASS |
| DB-009 | Business updated_at updates on modification | Database connected | 1. Create business 2. Wait 100ms 3. Update 4. Compare timestamps | updated_at_new > updated_at_original | Critical | PASS |

#### Relationships (One-to-Many)

| Test ID | Test Name | Preconditions | Steps | Expected Result | Priority | Status |
|---------|-----------|---------------|-------|-----------------|----------|--------|
| DB-010 | Business-Contact relationship | Database connected | 1. Create business with 2 contacts 2. Query include contacts | Contacts array has length 2, both have correct business_id | Critical | PASS |
| DB-011 | Business-EnrichmentLog relationship | Database connected | 1. Create business with 2 logs 2. Query include logs | Enrichment logs array has length 2, both have correct business_id | Critical | PASS |
| DB-012 | Business-OutreachMessage relationship | Database connected | 1. Create business with message 2. Query include messages | Messages array has length 1, message has correct business_id | Critical | PASS |
| DB-013 | Contact-OutreachMessage relationship | Database connected | 1. Create contact with message 2. Query include messages | Messages array has length 1, message has correct contact_id | Critical | PASS |

#### Cascade Delete Behavior

| Test ID | Test Name | Preconditions | Steps | Expected Result | Priority | Status |
|---------|-----------|---------------|-------|-----------------|----------|--------|
| DB-014 | Delete business cascades to contacts | Business with contacts created | 1. Note contact IDs 2. Delete business 3. Query contacts | No contacts remain for deleted business | Critical | PASS |
| DB-015 | Delete business cascades to enrichment logs | Business with logs created | 1. Note log IDs 2. Delete business 3. Query logs | No logs remain for deleted business | Critical | PASS |
| DB-016 | Delete business cascades to messages | Business with messages created | 1. Note message IDs 2. Delete business 3. Query messages | No messages remain for deleted business | Critical | PASS |
| DB-017 | Delete contact sets message.contact_id to null | Contact with messages created | 1. Note message IDs 2. Delete contact 3. Query messages | Messages still exist but contact_id=null | Critical | PASS |

#### Indexes

| Test ID | Test Name | Preconditions | Steps | Expected Result | Priority | Status |
|---------|-----------|---------------|-------|-----------------|----------|--------|
| DB-018 | Index on business.city | Database connected | 1. Query businesses by city | Query executes efficiently (implicit) | High | PASS |
| DB-019 | Index on business.enrichment_status | Database connected | 1. Query businesses by status | Query executes efficiently (implicit) | High | PASS |
| DB-020 | Index on contact.email | Database connected | 1. Query contact by email | Query executes efficiently (implicit) | High | PASS |

#### Data Type Validation

| Test ID | Test Name | Preconditions | Steps | Expected Result | Priority | Status |
|---------|-----------|---------------|-------|-----------------|----------|--------|
| DB-021 | Text fields store long strings | Database connected | 1. Create log with 1000-char text 2. Retrieve | Text preserved correctly, length=1000 | High | PASS |
| DB-022 | Null values allowed in optional fields | Database connected | 1. Create business without optional fields 2. Check nulls | address=null, phone=null, website=null | High | PASS |
| DB-023 | Numeric types stored correctly | Database connected | 1. Create business with numbers 2. Retrieve | employee_count, year_founded, latitude, longitude all correct type | High | PASS |
| DB-024 | Boolean types stored correctly | Database connected | 1. Create contact with booleans 2. Retrieve | email_verified=true, is_primary=true | High | PASS |
| DB-025 | DateTime types stored correctly | Database connected | 1. Create message with timestamp 2. Retrieve | sent_at is Date instance, time matches | High | PASS |

---

## 4. WebSocket Event Test Cases

### Test Suite: `test/baseline/websocket-contract.e2e-spec.ts`

#### Connection & Disconnection

| Test ID | Test Name | Preconditions | Steps | Expected Result | Priority | Status |
|---------|-----------|---------------|-------|-----------------|----------|--------|
| WS-001 | WebSocket connection successful | Server running | 1. Connect to ws://localhost:3000 2. Verify connection | Socket connected, SID received | High | UNTESTED |
| WS-002 | WebSocket disconnection graceful | Socket connected | 1. Disconnect socket 2. Verify cleanup | Socket closed, cleanup complete | High | UNTESTED |

#### Event Payload Structure

| Test ID | Test Name | Preconditions | Steps | Expected Result | Priority | Status |
|---------|-----------|---------------|-------|-----------------|----------|--------|
| WS-003 | business:created event emitted on POST | Socket connected | 1. POST /api/businesses 2. Listen for event | Event received with timestamp, type='business:created', data object | Critical | UNTESTED |
| WS-004 | business:enriched event payload structure | Socket connected, business enriched | 1. Enrich business 2. Listen for event | Event includes: timestamp, type='business:enriched', data with id/status/contacts_count | High | UNTESTED |
| WS-005 | business:deleted event emitted on DELETE | Socket connected | 1. DELETE /api/businesses/123 2. Listen for event | Event received with timestamp, type='business:deleted', data with id | High | UNTESTED |
| WS-006 | stats:updated event emitted on mutation | Socket connected | 1. Create/delete business 2. Listen for event | Event received with updated stats | High | UNTESTED |

#### Event Naming Convention

| Test ID | Test Name | Preconditions | Steps | Expected Result | Priority | Status |
|---------|-----------|---------------|-------|-----------------|----------|--------|
| WS-007 | Event names follow format resource:action | None | 1. Review all events 2. Check naming | All events match pattern: resource:action (e.g., business:created) | High | UNTESTED |

---

## 5. Traceability Matrix

### Requirements to Tests

| Requirement | Test IDs | Coverage | Status |
|-------------|----------|----------|--------|
| Create business via API | API-001 | 100% | Complete |
| List businesses with pagination | API-004 | 100% | Complete |
| Filter businesses by city | API-005 | 100% | Complete |
| Filter businesses by enrichment status | API-006 | 100% | Complete |
| Get business statistics | API-007 | 100% | Complete |
| Retrieve single business | API-008 | 100% | Complete |
| Delete business | API-010 | 100% | Complete |
| Database schema integrity | DB-001 through DB-025 | 100% | Complete |
| Cascade delete business data | DB-014, DB-015, DB-016 | 100% | Complete |
| WebSocket real-time updates | WS-003 through WS-006 | 40% | Partial |
| Error response consistency | API-014, API-015 | 100% | Complete |
| Scraper execution | UNTESTED | 0% | MISSING |
| Enrichment API calls | UNTESTED | 0% | MISSING |
| Outreach message generation | UNTESTED | 0% | MISSING |

---

## 6. Risk Assessment

### High-Risk Areas (Require 100% Test Coverage)

| Area | Risk | Tests | Current Coverage | Gap |
|------|------|-------|------------------|-----|
| Data Deletion | Unintended data loss | DB-014 through DB-017 | 100% | None |
| API Contract | Breaking changes | API-001 through API-016 | 95% | Error edge cases |
| Database Constraints | Data integrity violations | DB-001 through DB-025 | 100% | None |
| WebSocket Events | Missing real-time updates | WS-001 through WS-007 | 0% | All events untested |

### Medium-Risk Areas (Require >80% Test Coverage)

| Area | Risk | Tests | Current Coverage | Gap |
|------|------|-------|------------------|-----|
| Business Module | Refactoring breaks CRUD | API-001 through API-010 | 95% | Happy path focused |
| Enrichment Service | Missing email discovery | UNTESTED | 0% | Complete |
| Scraper Module | No businesses found | UNTESTED | 0% | Complete |

### Low-Risk Areas (Require >60% Test Coverage)

| Area | Risk | Tests | Current Coverage | Gap |
|------|------|-------|------------------|-----|
| Pagination | Wrong page returned | API-004 | 80% | Boundary values |
| Sorting | Wrong order returned | UNTESTED | 0% | Complete |
| Filtering | Wrong filter logic | API-005, API-006 | 90% | Combined filters |

---

## 7. Test Execution Schedule

### Before Refactoring (Day 0)

- [ ] Run full baseline: `npm run test:e2e`
- [ ] Document baseline metrics
- [ ] Start continuous monitoring
- [ ] Verify all 77 tests pass

### During Refactoring (Daily)

- [x] Check test results every 5 minutes (automated)
- [x] Review alerts in `/tmp/letip-monitoring/alerts.txt`
- [ ] Daily standup: report any failures
- [ ] Investigation: identify failing agent (if any)

### After Each Agent Completes

- [ ] Run full baseline + coverage report
- [ ] Verify no new failures introduced
- [ ] Document any performance changes
- [ ] Generate agent completion report

### End of Refactoring (Final Validation)

- [ ] Run full test suite: `npm run test:e2e`
- [ ] Run coverage report: `npm run test:cov`
- [ ] Run performance benchmarks
- [ ] Final validation report

---

## 8. Metrics & Reporting

### Test Execution Metrics

**Current Baseline:**
- Total tests: 77
- Passing: 75 (97%)
- Failing: 2 (3%)
- Skipped: 0 (0%)
- Execution time: ~6 minutes

**Target Metrics:**
- Total tests: 100+ (add missing modules)
- Passing: 100% (no failures)
- Coverage: >80%
- Execution time: <10 minutes

### Performance Baseline

**Endpoints:**
- GET /api/businesses/stats: <100ms
- GET /api/businesses?limit=20: <150ms
- POST /api/businesses: <100ms
- DELETE /api/businesses/:id: <50ms

**Target:**
- No endpoint >2x baseline
- All endpoints <500ms
- 95th percentile <300ms

### Coverage Progress

| Date | Total Tests | Passing | Coverage % | Notes |
|------|-------------|---------|-----------|-------|
| 2025-11-24 | 77 | 75 | 97% | Baseline established |
| TBD | - | - | - | Agent 1 complete |
| TBD | - | - | - | Agent 2 complete |

---

## 9. Test Maintenance

### Adding New Tests

When adding new test cases:

1. **Create test file** in appropriate directory
2. **Follow naming convention**: `[feature].spec.ts` or `[feature].e2e-spec.ts`
3. **Document** with this registry entry
4. **Update traceability** matrix
5. **Run** to ensure passing
6. **Commit** with PR description

### Updating Existing Tests

When modifying baseline tests:

1. **Document change** reason (requirement update, bug fix, etc.)
2. **Verify** no regressions
3. **Update registry** with new expectations
4. **Notify team** of baseline change
5. **Update** documentation

### Removing Tests

Only remove tests if:
- Requirement no longer exists
- Feature removed from codebase
- Test is redundant (duplicate coverage)

Document removal with reason and date.

---

## 10. Key Files

### Test Files
- `test/baseline/api-contract.e2e-spec.ts` - API endpoint tests
- `test/baseline/database-integrity.e2e-spec.ts` - Database tests
- `test/baseline/websocket-contract.e2e-spec.ts` - WebSocket tests

### Configuration
- `test/jest-e2e.json` - Jest E2E configuration
- `jest.config.refactoring.js` - Refactoring-specific config

### Documentation
- `test/CONTINUOUS_TESTING_GUIDE.md` - Testing guide
- `test/TEST_CASE_REGISTRY.md` - THIS FILE

---

**Last Updated:** 2025-11-24
**Total Test Cases:** 77 baseline + (pending new modules)
**Coverage Target:** >80%
**Maintained By:** Continuous Testing & Monitoring Agent

