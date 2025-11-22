# Coding Prompt: Migrate Google Maps Scraper from Puppeteer to Apify

## Feature Description and Problem Solving

### Problem
The current Google Maps scraper (`nodejs_space/src/scraper/scraper.service.ts`) uses Puppeteer for web scraping, which has several significant limitations:

1. **Infrastructure Overhead**: Requires managing headless Chrome browser instances, memory management, and browser lifecycle
2. **Fragility**: DOM selectors break when Google Maps updates their UI (e.g., `div.fontHeadlineSmall`, `div.fontBodyMedium`)
3. **Performance**: Sequential scrolling and manual delay management (`await this.delay(2000)`) slows scraping
4. **Scalability**: Each scrape holds a browser instance in memory, limiting concurrent operations
5. **Maintenance Burden**: 177 lines of complex DOM manipulation code that requires constant updates
6. **Rate Limiting**: No built-in quota management or retry logic for Google Maps anti-bot measures

### Solution
Migrate to **Apify's official Google Maps Scraper actor** (`apify/google-maps-scraper`), a production-grade managed scraping service that provides:

- **Managed Infrastructure**: No browser lifecycle management needed
- **Reliable Extraction**: Official actor maintained by Apify, handles Google Maps UI changes
- **Built-in Rate Limiting**: Automatic retry logic and quota management
- **Better Performance**: Parallel scraping capabilities and optimized data extraction
- **Simpler Code**: Reduces service from 177 lines to ~80 lines
- **Production Ready**: Used by thousands of production applications

---

## User Story

**As a** Le Tip network administrator
**I want** a reliable Google Maps scraper that doesn't break when Google updates their UI
**So that** I can consistently discover new business leads without manual intervention or service failures

**Acceptance:**
- Scraper successfully extracts businesses from Google Maps with same data fields as current implementation
- WebSocket events emit scraping progress in real-time
- Duplicate businesses are skipped based on name + address
- All scraped businesses are saved to database with proper relationships
- Stats are updated and broadcast via WebSocket after scraping completes
- Apify API errors are handled gracefully with proper logging
- No Puppeteer dependencies remain in the codebase

---

## Solution and Approach Rationale

### Why Apify Over Puppeteer

1. **Separation of Concerns**: Scraping is infrastructure, not business logic. Apify abstracts scraping complexity so we focus on lead management.

2. **Production Reliability**: Apify actors are battle-tested with:
   - Built-in proxy rotation
   - Automatic retry logic
   - Anti-bot detection evasion
   - Rate limit handling

3. **Maintainability**: When Google Maps changes their DOM structure (happens 2-3 times/year), Apify updates the actor. With Puppeteer, we fix broken selectors manually.

4. **Performance**: Apify runs on managed cloud infrastructure optimized for scraping. Puppeteer runs on our NestJS server, competing for resources.

5. **Cost-Effectiveness**:
   - **Puppeteer**: Chrome instances consume ~300MB RAM each. Scraping 500 businesses = 500MB+ memory usage on our server.
   - **Apify**: Pay-per-use actor credits. First 5,000 searches/month free, then $49/month for 50,000 searches.

### Architecture Decision

**Pattern**: External service integration (same pattern as Hunter.io, AbstractAPI)

**Implementation**:
- Install `apify-client` npm package
- Add Apify API token to `~/.config/letip_api_secrets.json`
- ConfigService loads token via `getApifyApiToken()` method
- ScraperService calls Apify actor, polls for completion, processes results
- Emit WebSocket events for progress (same as current implementation)
- Remove Puppeteer dependencies completely

**Data Flow**:
```
ScraperController.scrape(dto)
  ↓
ScraperService.scrapeGoogleMaps(dto)
  ↓
Apify Actor Execution
  ↓
Poll for actor run completion
  ↓
Process actor results
  ↓
BusinessesService.create() for each business
  ↓
EventsGateway.emitScrapingProgress()
  ↓
EventsGateway.emitStatsUpdated()
```

---

## Relevant Files to Read

### Core Implementation Files

1. **`nodejs_space/src/scraper/scraper.service.ts:1-177`**
   - Current Puppeteer implementation
   - **Key patterns to preserve**:
     - `scrapeGoogleMaps()` method signature
     - DTO usage (`ScrapeRequestDto`)
     - City parsing logic from address (lines 119-125)
     - Duplicate detection (lines 128-138)
     - Error handling and logging pattern
     - WebSocket progress emissions
     - Stats update after scraping

2. **`nodejs_space/src/scraper/scraper.controller.ts:1-20`**
   - HTTP endpoint definition
   - **No changes needed** - controller remains identical
   - Verify Swagger annotations still accurate

3. **`nodejs_space/src/scraper/scraper.module.ts:1-14`**
   - Module dependency injection
   - **No changes needed** - module structure unchanged

4. **`nodejs_space/src/scraper/dto/scrape-request.dto.ts:1-45`**
   - Request validation schema
   - **No changes needed** - DTO remains identical
   - Fields: `location`, `radius`, `business_type`, `max_results`

5. **`nodejs_space/src/businesses/businesses.service.ts:17-36`**
   - `create()` method for saving businesses
   - WebSocket event emission pattern (`emitBusinessCreated`, `emitStatsUpdated`)
   - **Pattern to replicate**: Always emit events after mutations

6. **`nodejs_space/src/websocket/websocket.gateway.ts:49-52`**
   - `emitScrapingProgress()` method
   - Use this to emit real-time scraping updates

7. **`nodejs_space/src/config/config.service.ts:1-97`**
   - Secrets loading pattern from `~/.config/letip_api_secrets.json`
   - **Pattern to replicate**: Add `getApifyApiToken()` method similar to `getHunterApiKey()` (line 74)

8. **`nodejs_space/prisma/schema.prisma:11-39`**
   - Business model definition
   - Required fields: `name`
   - Optional fields: `address`, `city`, `phone`, `website`, `google_maps_url`, `latitude`, `longitude`, `business_type`

9. **`GlobalRuleSections.md:1-596`**
   - **Critical sections**:
     - Section 1: Core Principles (MODULE ISOLATION, REAL-TIME FIRST, EXTERNAL API RESILIENCE)
     - Section 5: WebSocket Event Standards (`<resource>:<action>` naming)
     - Section 7: Testing Patterns (unit + e2e)
     - Section 8: Error Handling Standards (try/catch, NestJS exceptions, logging)
     - Section 10: Apify Actor Management (lines 564-576)

10. **`nodejs_space/package.json:22-41`**
    - Current dependencies (Puppeteer on line 38)
    - **Changes needed**:
      - Add `apify-client` to dependencies
      - Remove `puppeteer` and `@types/puppeteer`

---

## Researched Documentation Links

### Apify Google Maps Scraper Documentation

**[Apify Google Maps Scraper Actor](https://apify.com/apify/google-maps-scraper)**

**Summary**: Official Apify actor for extracting businesses from Google Maps. Supports location search, category filtering, custom search strings, and detailed place data extraction.

**Key Features**:
- Search by location string (e.g., "Route 9, Freehold, NJ")
- Filter by category/business type
- Extract business details: name, address, phone, website, coordinates, ratings, reviews
- Configurable result limits (`maxCrawledPlacesPerSearch`)
- Built-in deduplication
- Proxy rotation and anti-bot evasion

**Input Parameters We'll Use**:
```json
{
  "searchStringsArray": ["Route 9, Freehold, NJ"],
  "maxCrawledPlacesPerSearch": 50,
  "language": "en",
  "includeWebResults": true
}
```

**Output Format**:
```json
{
  "title": "Business Name",
  "address": "123 Main St, Freehold, NJ 07728",
  "phone": "+1 732-555-0123",
  "website": "https://example.com",
  "url": "https://www.google.com/maps/place/...",
  "location": {
    "lat": 40.2607,
    "lng": -74.2739
  },
  "categoryName": "Restaurant",
  "placeId": "ChIJ...",
  "totalScore": 4.5,
  "reviewsCount": 123
}
```

---

**[Apify JavaScript Client Documentation](https://docs.apify.com/api/client/js/reference/class/ApifyClient)**

**Summary**: Official Node.js SDK for calling Apify actors programmatically.

**Installation**:
```bash
npm install apify-client
```

**Usage Pattern**:
```typescript
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: APIFY_API_TOKEN });

// Run actor
const run = await client.actor('apify/google-maps-scraper').call(input);

// Wait for completion
const { defaultDatasetId } = await client.run(run.id).waitForFinish();

// Get results
const { items } = await client.dataset(defaultDatasetId).listItems();
```

**Key Methods**:
- `client.actor(actorId).call(input)` - Start actor run
- `client.run(runId).waitForFinish()` - Poll until complete
- `client.dataset(datasetId).listItems()` - Retrieve results

---

**[Apify Rate Limits and Pricing](https://apify.com/pricing)**

**Summary**: Apify uses credit-based pricing. Free tier includes 5,000 searches/month.

**Quota Management**:
- Monitor usage via Apify dashboard
- Handle quota exceeded errors gracefully
- Log all Apify API calls for debugging

---

## Implementation Plan

### Foundational Work

1. **Add Apify API token to secrets file**
   - Update `~/.config/letip_api_secrets.json`:
     ```json
     {
       "apify": {
         "secrets": {
           "api_token": { "value": "apify_api_xxx" }
         }
       }
     }
     ```

2. **Install Apify client dependency**
   ```bash
   cd nodejs_space
   yarn add apify-client
   ```

3. **Remove Puppeteer dependencies**
   ```bash
   yarn remove puppeteer @types/puppeteer
   ```

4. **Add `getApifyApiToken()` method to ConfigService**
   - File: `nodejs_space/src/config/config.service.ts`
   - Add method following pattern of `getHunterApiKey()` (line 74-76)
   - Return type: `string | null`

5. **Update secrets file path in ConfigService**
   - Change line 35 from `'abacusai_auth_secrets.json'` to `'letip_api_secrets.json'`

---

### Core Implementation

1. **Rewrite `scrapeGoogleMaps()` method in ScraperService**
   - File: `nodejs_space/src/scraper/scraper.service.ts`
   - Replace lines 17-171 (current Puppeteer implementation)
   - New implementation steps:
     a. Initialize ApifyClient with token from ConfigService
     b. Build actor input from `ScrapeRequestDto`
     c. Call actor: `client.actor('apify/google-maps-scraper').call(input)`
     d. Emit initial progress event: `emitScrapingProgress({ status: 'running', progress: 0 })`
     e. Wait for completion: `client.run(runId).waitForFinish()`
     f. Retrieve dataset: `client.dataset(datasetId).listItems()`
     g. Process results (map Apify output to Business model)
     h. Save businesses via `BusinessesService.create()`
     i. Emit progress updates periodically
     j. Emit final stats update

2. **Map Apify output to Business model**
   - Apify field → Prisma field mapping:
     - `title` → `name`
     - `address` → `address`
     - Parse city from address (preserve existing logic lines 119-125)
     - `phone` → `phone`
     - `website` → `website`
     - `url` → `google_maps_url`
     - `location.lat` → `latitude`
     - `location.lng` → `longitude`
     - `categoryName` → `business_type` (if not provided in DTO)

3. **Preserve duplicate detection logic**
   - Keep lines 128-138 (check existing business by name + address)
   - Skip if duplicate found

4. **Add comprehensive error handling**
   - Wrap Apify calls in try/catch
   - Handle specific errors:
     - `ACTOR_NOT_FOUND` - Invalid actor ID
     - `QUOTA_EXCEEDED` - Rate limit hit
     - `RUN_TIMEOUT` - Actor took too long
     - `NETWORK_ERROR` - Connection issues
   - Log all errors with context
   - Emit error progress event: `emitScrapingProgress({ status: 'failed', error: message })`

5. **Implement progress tracking**
   - Emit progress events during actor execution:
     - `status: 'initializing'` - When actor starts
     - `status: 'running', progress: X%` - During execution
     - `status: 'processing'` - When processing results
     - `status: 'completed'` - When finished
   - Use `EventsGateway.emitScrapingProgress()`

---

### Integration Work

1. **Update ConfigService constructor to load new secrets path**
   - Ensure `letip_api_secrets.json` is loaded instead of `abacusai_auth_secrets.json`

2. **Verify ScraperModule dependency injection**
   - Ensure `ConfigService` is available to `ScraperService`
   - No changes needed if ConfigModule is already global

3. **Test WebSocket event flow**
   - Verify `EventsGateway.emitScrapingProgress()` emits to all connected clients
   - Test with wscat: `wscat -c ws://localhost:3000/socket.io/?EIO=4&transport=websocket`

4. **Update CLAUDE.md troubleshooting section**
   - Replace Puppeteer troubleshooting with Apify-specific debugging
   - Document common Apify errors and solutions

5. **Clean up imports**
   - Remove `import * as puppeteer from 'puppeteer';` from scraper.service.ts
   - Add `import { ApifyClient } from 'apify-client';`

---

### Step-by-Step Task List

**Phase 1: Setup (5 tasks)**

1. [ ] Create/update `~/.config/letip_api_secrets.json` with Apify API token
2. [ ] Install `apify-client` dependency: `yarn add apify-client`
3. [ ] Remove Puppeteer dependencies: `yarn remove puppeteer @types/puppeteer`
4. [ ] Add `getApifyApiToken()` method to `ConfigService` (follow `getHunterApiKey()` pattern)
5. [ ] Update secrets file path in ConfigService from `abacusai_auth_secrets.json` to `letip_api_secrets.json`

**Phase 2: Core Implementation (8 tasks)**

6. [ ] Import ApifyClient in `scraper.service.ts`
7. [ ] Initialize ApifyClient in `scrapeGoogleMaps()` using `this.configService.getApifyApiToken()`
8. [ ] Build Apify actor input from `ScrapeRequestDto`:
   - `searchStringsArray`: `[location]` (combine with `business_type` if provided)
   - `maxCrawledPlacesPerSearch`: `max_results`
   - `language`: `"en"`
9. [ ] Call Apify actor: `const run = await client.actor('apify/google-maps-scraper').call(input)`
10. [ ] Emit initial progress: `this.eventsGateway.emitScrapingProgress({ status: 'running', location, progress: 0 })`
11. [ ] Wait for actor completion: `await client.run(run.id).waitForFinish()`
12. [ ] Retrieve results: `const { items } = await client.dataset(run.defaultDatasetId).listItems()`
13. [ ] Emit processing progress: `this.eventsGateway.emitScrapingProgress({ status: 'processing', found: items.length })`

**Phase 3: Data Processing (6 tasks)**

14. [ ] Map Apify results to Business model (title → name, address, phone, website, url → google_maps_url, location.lat/lng → latitude/longitude)
15. [ ] Parse city from address using existing logic (lines 119-125 from old implementation)
16. [ ] Implement duplicate detection (check `prisma.business.findFirst({ where: { name, address } })`)
17. [ ] Save non-duplicate businesses via `this.businessesService.create()`
18. [ ] Track saved/skipped counts
19. [ ] Emit stats update: `this.eventsGateway.emitStatsUpdated(await this.businessesService.getStats())`

**Phase 4: Error Handling (4 tasks)**

20. [ ] Wrap all Apify calls in try/catch block
21. [ ] Handle Apify-specific errors (quota exceeded, timeout, network errors)
22. [ ] Log errors with context: `this.logger.error('Apify actor failed', { error, location, runId })`
23. [ ] Emit error progress event: `this.eventsGateway.emitScrapingProgress({ status: 'failed', error: error.message })`

**Phase 5: Testing (5 tasks)**

24. [ ] Write unit tests for `scrapeGoogleMaps()` with mocked ApifyClient
25. [ ] Test duplicate detection logic
26. [ ] Test error handling (mock Apify failures)
27. [ ] Write e2e test: POST `/api/scrape` → verify businesses saved
28. [ ] Manual test with wscat to verify WebSocket events

**Phase 6: Cleanup (3 tasks)**

29. [ ] Remove all Puppeteer code from `scraper.service.ts`
30. [ ] Update CLAUDE.md with Apify troubleshooting section
31. [ ] Run `yarn lint && yarn format` to fix formatting

---

## Testing Strategy

### Unit Tests

**File**: `nodejs_space/src/scraper/scraper.service.spec.ts`

**Test Cases**:

1. **Test: Should successfully scrape businesses from Apify**
   - Mock `ApifyClient.actor().call()` to return run object
   - Mock `ApifyClient.run().waitForFinish()` to return dataset ID
   - Mock `ApifyClient.dataset().listItems()` to return sample businesses
   - Mock `BusinessesService.create()` to succeed
   - Assert: Businesses are created with correct data
   - Assert: WebSocket events emitted (scraping:progress, stats:updated)

2. **Test: Should skip duplicate businesses**
   - Mock Apify to return 3 businesses
   - Mock `prisma.business.findFirst()` to return existing business for 1 of them
   - Assert: Only 2 businesses created
   - Assert: `skipped` count is 1 in return value

3. **Test: Should parse city from address correctly**
   - Mock Apify to return business with address "123 Main St, Freehold, NJ 07728"
   - Assert: City extracted as "Freehold"

4. **Test: Should handle Apify quota exceeded error**
   - Mock `ApifyClient.actor().call()` to throw quota exceeded error
   - Assert: Error is caught and logged
   - Assert: Error progress event emitted

5. **Test: Should handle Apify timeout error**
   - Mock `ApifyClient.run().waitForFinish()` to throw timeout error
   - Assert: Error is caught and logged
   - Assert: Returns error result

6. **Test: Should emit progress events**
   - Mock successful Apify call
   - Assert: `emitScrapingProgress()` called with:
     - `{ status: 'running' }` at start
     - `{ status: 'processing', found: X }` after retrieval
     - `{ status: 'completed', saved: X, skipped: Y }` at end

**Mock Pattern**:
```typescript
describe('ScraperService', () => {
  let service: ScraperService;
  let configService: ConfigService;
  let businessesService: BusinessesService;
  let eventsGateway: EventsGateway;
  let apifyClient: ApifyClient;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ScraperService,
        {
          provide: ConfigService,
          useValue: {
            getApifyApiToken: jest.fn().mockReturnValue('test_token')
          }
        },
        {
          provide: BusinessesService,
          useValue: {
            create: jest.fn(),
            getStats: jest.fn()
          }
        },
        {
          provide: EventsGateway,
          useValue: {
            emitScrapingProgress: jest.fn(),
            emitStatsUpdated: jest.fn()
          }
        },
        {
          provide: PrismaService,
          useValue: {
            business: { findFirst: jest.fn() }
          }
        }
      ]
    }).compile();

    service = module.get<ScraperService>(ScraperService);
  });

  // Tests here
});
```

---

### Integration Tests

**File**: `nodejs_space/test/scraper/scraper.integration.spec.ts`

**Test Cases**:

1. **Test: Apify actor completes and returns data**
   - Use real ApifyClient (or test actor if available)
   - Call `scrapeGoogleMaps()` with test location
   - Assert: Actor completes within timeout (60s)
   - Assert: Dataset contains results
   - Note: May skip in CI if Apify token not configured

2. **Test: Database integration**
   - Use test database
   - Run scraper with small max_results (5)
   - Assert: Businesses saved to database
   - Assert: Duplicate detection prevents re-insertion
   - Cleanup: Delete test businesses after

---

### End-to-End Tests

**File**: `nodejs_space/test/scraper/scraper.e2e-spec.ts`

**Test Cases**:

1. **Test: POST /api/scrape returns success**
   ```typescript
   it('POST /api/scrape should scrape and save businesses', async () => {
     const response = await request(app.getHttpServer())
       .post('/api/scrape')
       .send({
         location: 'Route 9, Freehold, NJ',
         max_results: 10
       })
       .expect(200);

     expect(response.body).toHaveProperty('success', true);
     expect(response.body).toHaveProperty('found');
     expect(response.body).toHaveProperty('saved');
   });
   ```

2. **Test: WebSocket events emitted during scraping**
   - Connect Socket.io client
   - Listen for `scraping:progress` events
   - Trigger scrape via API
   - Assert: Progress events received
   - Assert: Final `stats:updated` event received

3. **Test: Invalid DTO returns 400**
   ```typescript
   it('POST /api/scrape with invalid data should return 400', async () => {
     await request(app.getHttpServer())
       .post('/api/scrape')
       .send({ location: 123 }) // Invalid: location must be string
       .expect(400);
   });
   ```

---

### Edge Cases for Testing

1. **Empty Apify results**
   - **Scenario**: Actor returns 0 results
   - **Expected**: Return `{ success: true, found: 0, saved: 0, skipped: 0 }`
   - **Test**: Mock `listItems()` to return empty array

2. **All businesses are duplicates**
   - **Scenario**: All Apify results already exist in database
   - **Expected**: Return `{ success: true, found: 5, saved: 0, skipped: 5 }`
   - **Test**: Mock `findFirst()` to always return existing business

3. **Apify API token missing**
   - **Scenario**: `getApifyApiToken()` returns null
   - **Expected**: Throw `BadRequestException` with message "Apify API token not configured"
   - **Test**: Mock `getApifyApiToken()` to return null

4. **Apify actor times out**
   - **Scenario**: `waitForFinish()` exceeds timeout
   - **Expected**: Throw error and log timeout
   - **Test**: Mock `waitForFinish()` to reject with timeout error

5. **Network error during actor call**
   - **Scenario**: `actor().call()` throws network error
   - **Expected**: Catch error, log, and emit error progress event
   - **Test**: Mock `call()` to reject with network error

6. **Malformed Apify response**
   - **Scenario**: Actor returns results with missing required fields (no `title`)
   - **Expected**: Skip businesses without name, log warning
   - **Test**: Mock `listItems()` to return items with missing fields

7. **Business save fails (database error)**
   - **Scenario**: `businessesService.create()` throws Prisma error
   - **Expected**: Log error, add to errors array, continue processing remaining businesses
   - **Test**: Mock `create()` to throw error for specific business

8. **Invalid location string**
   - **Scenario**: DTO validation passes but Apify actor can't geocode location
   - **Expected**: Actor completes but returns 0 results
   - **Test**: Use nonsensical location like "xyzabc123"

9. **Concurrent scrape requests**
   - **Scenario**: Two API calls to `/api/scrape` simultaneously
   - **Expected**: Both should complete independently without data corruption
   - **Test**: Send 2 parallel requests, verify both return success

10. **Special characters in business names/addresses**
    - **Scenario**: Apify returns business with name containing apostrophes, quotes, unicode
    - **Expected**: Prisma escapes properly, saves without SQL injection risk
    - **Test**: Mock Apify to return business with name `O'Reilly's "Best" Café`

---

## Acceptance Criteria

### Functional Requirements

- ✅ **AC1**: Scraper successfully calls Apify Google Maps Scraper actor and retrieves results
- ✅ **AC2**: All businesses from Apify are mapped correctly to Prisma Business model
- ✅ **AC3**: Duplicate businesses (same name + address) are skipped
- ✅ **AC4**: Non-duplicate businesses are saved to database with all available fields
- ✅ **AC5**: City is correctly parsed from address string
- ✅ **AC6**: WebSocket event `scraping:progress` emitted with status updates (running, processing, completed)
- ✅ **AC7**: WebSocket event `stats:updated` emitted after scraping completes
- ✅ **AC8**: Return value includes `{ success, found, saved, skipped, errors }` matching current implementation
- ✅ **AC9**: Apify API errors are caught, logged, and returned in errors array

### Non-Functional Requirements

- ✅ **AC10**: No Puppeteer dependencies remain in `package.json`
- ✅ **AC11**: No Puppeteer imports remain in codebase
- ✅ **AC12**: All unit tests pass with >80% code coverage for scraper.service.ts
- ✅ **AC13**: E2E test passes for `POST /api/scrape`
- ✅ **AC14**: TypeScript compiles with zero errors
- ✅ **AC15**: ESLint passes with zero warnings/errors
- ✅ **AC16**: Prettier formatting applied
- ✅ **AC17**: CLAUDE.md updated with Apify troubleshooting section

### Performance Requirements

- ✅ **AC18**: Scraping 50 businesses completes in <60 seconds (Apify actor execution time)
- ✅ **AC19**: Memory usage does not spike (no browser instances held)
- ✅ **AC20**: Concurrent scrape requests do not block each other

---

## Validation Commands

### 1. TypeScript Compilation

```bash
cd nodejs_space
npx tsc --noEmit
```

**Expected**: `✓ Compiled successfully with 0 errors`

---

### 2. Linting

```bash
yarn lint
```

**Expected**: No errors or warnings

---

### 3. Code Formatting

```bash
yarn format
git diff
```

**Expected**: No uncommitted formatting changes

---

### 4. Unit Tests

```bash
yarn test scraper.service.spec.ts
```

**Expected**: All tests pass

```bash
yarn test:cov scraper.service.spec.ts
```

**Expected**: Coverage >80% for scraper.service.ts

---

### 5. E2E Tests

```bash
yarn test:e2e scraper.e2e-spec.ts
```

**Expected**: All e2e tests pass

---

### 6. Build Production Bundle

```bash
yarn build
```

**Expected**: Successful compilation with no errors

---

### 7. Manual API Test (Using curl)

**Start server**:
```bash
yarn start:dev
```

**Test scrape endpoint**:
```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Route 9, Freehold, NJ",
    "radius": 1,
    "business_type": "restaurant",
    "max_results": 5
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "found": 5,
  "saved": 3,
  "skipped": 2,
  "errors": []
}
```

---

### 8. WebSocket Event Verification

**Install wscat**:
```bash
npm install -g wscat
```

**Connect to WebSocket**:
```bash
wscat -c "ws://localhost:3000/socket.io/?EIO=4&transport=websocket"
```

**Trigger scrape** (in another terminal):
```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"location": "Freehold, NJ", "max_results": 5}'
```

**Expected WebSocket Messages**:
```
< {"type":"scraping:progress","data":{"status":"running","location":"Freehold, NJ"}}
< {"type":"scraping:progress","data":{"status":"processing","found":5}}
< {"type":"scraping:progress","data":{"status":"completed","saved":3,"skipped":2}}
< {"type":"stats:updated","data":{"totalBusinesses":103,"enrichedBusinesses":45,...}}
```

---

### 9. Database Verification

**Check businesses were saved**:
```bash
yarn prisma studio
```

**Navigate to**: `business` table
**Expected**: New businesses with `source: "google_maps"`, populated fields (name, address, city, phone, website, google_maps_url, latitude, longitude)

**SQL Query**:
```sql
SELECT id, name, address, city, phone, website, google_maps_url, latitude, longitude, created_at
FROM business
WHERE source = 'google_maps'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected**: Rows with complete data from recent scrape

---

### 10. Verify Puppeteer Removal

**Check dependencies**:
```bash
cat package.json | grep puppeteer
```

**Expected**: No matches (exit code 1)

**Check imports**:
```bash
grep -r "puppeteer" nodejs_space/src
```

**Expected**: No matches (exit code 1)

---

### 11. Verify Apify Integration

**Check Apify client installed**:
```bash
cat package.json | grep apify-client
```

**Expected**: `"apify-client": "^2.x.x"`

**Check ConfigService has getApifyApiToken**:
```bash
grep -n "getApifyApiToken" nodejs_space/src/config/config.service.ts
```

**Expected**: Method definition found

**Check secrets file**:
```bash
cat ~/.config/letip_api_secrets.json | jq '.apify'
```

**Expected**:
```json
{
  "secrets": {
    "api_token": {
      "value": "apify_api_xxx"
    }
  }
}
```

---

### 12. Swagger API Documentation Check

**Start server**:
```bash
yarn start:dev
```

**Open browser**:
```
http://localhost:3000/api-docs
```

**Navigate to**: `POST /api/scrape`

**Expected**:
- Request body shows `ScrapeRequestDto` schema
- Example values populated
- Response schema shows success/found/saved/skipped/errors

---

### 13. Complete Integration Test

**Run full test suite**:
```bash
yarn test && yarn test:e2e
```

**Expected**: All tests pass

---

### 14. Regression Check (Compare Results)

**Before migration** (current Puppeteer implementation):
1. Run scrape: `POST /api/scrape` with `{"location": "Freehold, NJ", "max_results": 10}`
2. Save result: `old_result.json`

**After migration** (new Apify implementation):
1. Run same scrape
2. Save result: `new_result.json`

**Compare**:
```bash
diff old_result.json new_result.json
```

**Expected**: Business count similar (±10%), all required fields present in both

---

### 15. Performance Benchmark

**Measure scrape duration**:
```bash
time curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"location": "Freehold, NJ", "max_results": 50}'
```

**Expected**: Completes in <60 seconds

**Memory check** (while scraping):
```bash
ps aux | grep "node.*nest"
```

**Expected**: Memory usage <500MB (no Puppeteer browser instances)

---

## Summary

This implementation migrates the Google Maps scraper from Puppeteer to Apify, reducing code complexity by 55% (177 lines → ~80 lines), eliminating browser infrastructure overhead, and providing production-grade reliability with built-in anti-bot evasion and rate limiting.

**Migration Impact**:
- ✅ **Reliability**: Actor maintained by Apify, no DOM selector breakage
- ✅ **Performance**: Faster scraping, lower memory usage
- ✅ **Maintainability**: 97 fewer lines of complex scraping code
- ✅ **Scalability**: No browser instance limits
- ✅ **Cost**: Free tier covers 5,000 searches/month

**Files Modified**: 3
**Files Deleted**: 0
**Dependencies Added**: 1 (`apify-client`)
**Dependencies Removed**: 2 (`puppeteer`, `@types/puppeteer`)
**Tests Required**: 6 unit + 2 e2e + 10 edge cases
