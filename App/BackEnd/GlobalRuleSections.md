# Global Rule Sections

Project-wide standards for the analytics dashboard. All agents and developers must follow these rules.

## Project Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Data Size** | 100K rows | No pagination needed; full dataset fits in memory |
| **Tenancy** | Multi-tenant | Tenant isolation at query level |
| **Export Formats** | CSV, PDF, Excel | All three required |
| **Architecture** | Vertical Slice (VSA) | Features are self-contained vertical slices |

---

## 1. Core Principles

### Data-First Philosophy
- **Never hard-code values** - Every chart, KPI, and table pulls from live data sources
- **CSV is the source of truth** - All transformations happen server-side via Polars
- **Validate at boundaries** - Check data shape on upload, not in rendering logic

### Performance by Default
- Use Polars lazy evaluation (`scan_csv`, `lazy()`) before `collect()`
- Target sub-100ms response times for filtered queries up to 1M rows
- Skeleton loaders for all async data fetches

### Progressive Enhancement
- UI renders immediately with loading states
- Data populates progressively (KPIs → charts → tables)
- Graceful degradation when data is missing or malformed

### Single Responsibility
- Backend: Data transformation, aggregation, validation
- Frontend: Rendering, user interaction, state management
- No business logic in components; delegate to hooks/services

---

## 2. Tech-Stack Decisions

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| **Data Engine** | Polars | Latest | 10-100x faster than Pandas, lazy evaluation, Rust-backed |
| **Backend** | Flask | 3.x | Lightweight, modular via Blueprints, easy deployment |
| **API Layer** | REST + WebSocket | - | REST for CRUD, WebSocket for real-time updates |
| **Frontend** | React | 18+ | Component model, concurrent rendering |
| **Type System** | TypeScript | 5.x | Strict mode enabled, no `any` types |
| **Charts** | Recharts | 2.x | React-native, performant with large datasets |
| **Styling** | Tailwind CSS | 3.x | Utility-first, glassmorphism via `backdrop-blur` |
| **State** | TanStack Query | 5.x | Server state management, caching, background refetch |
| **Forms** | React Hook Form | 7.x | Performance-focused, minimal re-renders |
| **Validation** | Zod | 3.x | Runtime type validation, schema inference |

### Explicitly Avoided
- **Pandas** - Too slow for production analytics
- **Redux** - Overkill for server-state-heavy apps
- **Moment.js** - Use `date-fns` or native `Intl`
- **jQuery** - No legacy DOM manipulation

---

## 3. Architecture Patterns

### Vertical Slice Architecture (VSA) - MANDATORY

VSA organizes code by **feature/capability**, not by technical layer. Each slice is self-contained and owns its entire stack.

#### VSA Principles

1. **Feature isolation** - Each feature folder contains ALL its code (components, hooks, API, types)
2. **No cross-feature imports** - Features never import from other features directly
3. **Shared only when proven** - Code moves to `shared/` only after 3+ features need it
4. **Slice ownership** - One developer/agent owns the entire vertical slice
5. **Independent deployability** - Each slice can theoretically be deployed separately

#### VSA Anti-Patterns (AVOID)

```
# BAD: Horizontal layers
components/
  DashboardChart.tsx
  UploadForm.tsx
  FilterBar.tsx
hooks/
  useDashboard.ts
  useUpload.ts
  useFilters.ts
api/
  dashboard.ts
  upload.ts
  filters.ts

# GOOD: Vertical slices
features/
  dashboard/
    components/DashboardChart.tsx
    hooks/useDashboard.ts
    api/dashboard-api.ts
  data-upload/
    components/UploadForm.tsx
    hooks/useUpload.ts
    api/upload-api.ts
```

### Directory Structure (Frontend)

```
src/
├── features/                    # Vertical slices by domain
│   ├── dashboard/
│   │   ├── components/          # Dashboard-specific components
│   │   ├── hooks/               # useDashboardData, useFilters
│   │   ├── api/                 # API calls for this feature
│   │   ├── types/               # TypeScript interfaces
│   │   └── index.ts             # Public exports only
│   ├── data-upload/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── types/
│   │   └── index.ts
│   ├── exports/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── utils/               # Export formatters (CSV, PDF, Excel)
│   │   └── index.ts
│   └── filters/
│       ├── components/
│       ├── hooks/
│       ├── context/             # Filter state context
│       └── index.ts
├── shared/                      # ONLY after 3+ features need it
│   ├── components/              # Reusable UI (glass-card, skeleton)
│   ├── hooks/                   # useDebounce, usePagination
│   ├── utils/                   # formatCurrency, parseCSV
│   └── types/                   # Global type definitions
├── core/
│   ├── api/                     # API client configuration
│   ├── providers/               # React context providers
│   ├── auth/                    # Tenant context, auth state
│   └── config/                  # Environment, constants
└── app/                         # Next.js/routing pages
```

### Directory Structure (Backend)

```
app/
├── routes/                      # Flask Blueprints
│   ├── data.py                  # Upload, query, schema
│   ├── analytics.py             # Aggregations, KPIs
│   └── exports.py               # CSV, PDF generation
├── services/
│   ├── polars_engine.py         # LazyFrame operations
│   ├── validation.py            # Schema validation
│   └── cache.py                 # Query caching
├── models/
│   └── schemas.py               # Pydantic/dataclass schemas
└── utils/
    ├── logging.py               # Structured logging setup
    └── errors.py                # Custom exceptions
```

### Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  CSV Upload  │────▶│ Polars       │────▶│ JSON         │
│  (Frontend)  │     │ LazyFrame    │     │ Response     │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                     ┌──────▼──────┐
                     │ Aggregation │
                     │ & Filtering │
                     └──────┬──────┘
                            │
┌──────────────┐     ┌──────▼──────┐
│  Recharts    │◀────│ TanStack    │
│  Render      │     │ Query Cache │
└──────────────┘     └─────────────┘
```

### Multi-Tenancy Pattern

Every request is scoped to a tenant. Tenant isolation is enforced at the query level.

```python
# Backend: Tenant middleware
@app.before_request
def inject_tenant():
    tenant_id = get_tenant_from_token(request.headers.get('Authorization'))
    if not tenant_id:
        abort(401, "Tenant context required")
    g.tenant_id = tenant_id

# All queries include tenant filter
def get_businesses(filters: dict) -> pl.DataFrame:
    df = pl.scan_csv(get_tenant_data_path(g.tenant_id))
    return df.filter(pl.col("tenant_id") == g.tenant_id).collect()
```

```typescript
// Frontend: Tenant context
const TenantContext = createContext<TenantState | null>(null);

// All API calls include tenant header
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'X-Tenant-ID': () => getTenantId(),
  },
});

// Queries are keyed by tenant
const { data } = useQuery({
  queryKey: ['dashboard', tenantId, filters],
  queryFn: () => fetchDashboard(filters),
});
```

#### Tenant Data Isolation

| Layer | Isolation Method |
|-------|------------------|
| **Storage** | Separate directories per tenant: `data/{tenant_id}/` |
| **Database** | Row-level security with `tenant_id` column |
| **Cache** | Cache keys prefixed: `tenant:{id}:dashboard:kpis` |
| **Logs** | All log entries include `tenant_id` field |

### Export Formats

Three export formats supported with specific libraries:

| Format | Library | Use Case |
|--------|---------|----------|
| **CSV** | Polars native `write_csv()` | Raw data, Excel import |
| **PDF** | ReportLab + WeasyPrint | Formatted reports, charts |
| **Excel** | openpyxl / xlsxwriter | Formatted tables, multi-sheet |

```python
# Backend: Export service (VSA - lives in features/exports/)
from io import BytesIO
import polars as pl
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table
from openpyxl import Workbook

class ExportService:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id

    def to_csv(self, df: pl.DataFrame) -> BytesIO:
        buffer = BytesIO()
        df.write_csv(buffer)
        buffer.seek(0)
        return buffer

    def to_excel(self, df: pl.DataFrame, sheet_name: str = "Data") -> BytesIO:
        buffer = BytesIO()
        df.write_excel(buffer, worksheet=sheet_name)
        buffer.seek(0)
        return buffer

    def to_pdf(self, df: pl.DataFrame, title: str) -> BytesIO:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        # Convert to table format for PDF
        table_data = [df.columns] + df.to_numpy().tolist()
        table = Table(table_data)
        doc.build([table])
        buffer.seek(0)
        return buffer
```

```typescript
// Frontend: Export feature slice
// features/exports/hooks/useExport.ts
export function useExport() {
  const { tenantId } = useTenant();

  const exportData = useMutation({
    mutationFn: async ({ format, filters }: ExportRequest) => {
      const response = await apiClient.post(
        `/exports/${format}`,
        { filters },
        { responseType: 'blob' }
      );

      // Trigger download
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  return { exportData };
}
```

### API Contract Pattern

All endpoints return consistent shapes:

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "total_rows": 15000,
    "filtered_rows": 342,
    "query_ms": 45
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required column: 'revenue'",
    "details": { "missing_columns": ["revenue"] }
  }
}
```

---

## 4. Documentation Standards

### File Headers

Every feature module includes a header comment:

```typescript
/**
 * @feature Dashboard Analytics
 * @description Real-time KPI cards and interactive charts
 * @data-source /api/analytics/overview
 * @filters region, channel, dateRange
 */
```

### Component Documentation

```typescript
interface ChartProps {
  /** Raw data points from API */
  data: DataPoint[];
  /** Active filter state */
  filters: FilterState;
  /** Callback when user clicks a data slice */
  onSlice: (dimension: string, value: string) => void;
  /** Chart type variant */
  variant?: 'line' | 'bar' | 'area';
}
```

### API Endpoint Documentation

```python
@bp.route('/api/analytics/kpis', methods=['GET'])
def get_kpis():
    """
    Get computed KPI metrics.

    Query Parameters:
        - region (str, optional): Filter by region name
        - channel (str, optional): Filter by sales channel
        - date_from (str, optional): ISO date string
        - date_to (str, optional): ISO date string

    Returns:
        {
            "total_revenue": float,
            "avg_order_value": float,
            "conversion_rate": float,
            "period_growth": float
        }

    Performance:
        - Target: <50ms for 1M rows
        - Uses Polars lazy evaluation
    """
```

### Conversation Logging

Maintain `CONVERSATION_LOG.md` during development sessions:

```markdown
# Conversation Log - [Date]

## Session Goals
- Implement filter bar component
- Connect to /api/analytics/kpis endpoint

## Decisions Made
- Using Zod for runtime filter validation
- Debounce filter changes by 300ms

## Code Changes
- Created `features/filters/components/FilterBar.tsx`
- Added `useFilters` hook with TanStack Query

## Open Questions
- Should we cache filter results in localStorage?
```

---

## 5. Logging Rules

### Backend Logging (Python/Flask)

```python
import structlog

log = structlog.get_logger()

# ALWAYS log these events:
log.info("data_uploaded",
    rows=df.height,
    columns=df.width,
    file_size_mb=round(size / 1024 / 1024, 2),
    schema=list(df.columns)
)

log.info("query_executed",
    endpoint="/api/analytics/kpis",
    filters=sanitize_filters(filters),
    result_rows=result.height,
    duration_ms=round(elapsed * 1000, 2)
)

log.warning("slow_query",
    endpoint=endpoint,
    duration_ms=duration,
    threshold_ms=100
)

log.error("polars_error",
    error_type=type(e).__name__,
    error_message=str(e),
    query_context=truncate(query, 200)
)
```

### Frontend Logging (TypeScript)

```typescript
// Use namespaced console methods
console.info('[Dashboard] Filters applied', {
  filters: sanitizeForLog(filters),
  resultCount
});

console.warn('[ChartRender] Empty dataset received', {
  endpoint,
  filters
});

console.error('[API] Request failed', {
  endpoint,
  status,
  error: error.message
});
```

### Never Log
- Raw data rows (PII/business data risk)
- Full file contents
- API keys, tokens, credentials
- User passwords or sensitive form data
- Full stack traces in production (use error tracking service)

### Log Levels

| Level | Use Case | Example |
|-------|----------|---------|
| `debug` | Development only | Variable values, function entry/exit |
| `info` | Normal operations | Requests, uploads, query completions |
| `warn` | Recoverable issues | Slow queries, deprecated usage |
| `error` | Failures | API errors, validation failures |

---

## 6. Testing Patterns

### Backend Tests (Python/pytest)

```python
# tests/test_polars_engine.py

import polars as pl
import pytest
from app.services.polars_engine import aggregate_by_region, apply_filters

class TestPolarsAggregation:
    """Test data transformation logic."""

    def test_aggregate_by_region_sums_correctly(self):
        df = pl.DataFrame({
            "region": ["North", "South", "North"],
            "sales": [100, 200, 150]
        })
        result = aggregate_by_region(df)

        assert result.filter(pl.col("region") == "North")["total_sales"][0] == 250
        assert result.filter(pl.col("region") == "South")["total_sales"][0] == 200

    def test_handles_empty_dataframe(self):
        df = pl.DataFrame({"region": [], "sales": []})
        result = aggregate_by_region(df)

        assert result.height == 0

    def test_filters_by_date_range(self):
        df = pl.DataFrame({
            "date": ["2024-01-01", "2024-02-01", "2024-03-01"],
            "value": [100, 200, 300]
        })
        result = apply_filters(df, date_from="2024-02-01", date_to="2024-02-28")

        assert result.height == 1
        assert result["value"][0] == 200
```

```python
# tests/test_api.py

def test_upload_validates_required_columns(client):
    """API rejects CSV missing required columns."""
    csv_content = "wrong_column,another\n1,2"
    response = client.post(
        "/api/data/upload",
        data={"file": (BytesIO(csv_content.encode()), "test.csv")}
    )

    assert response.status_code == 422
    assert "missing_columns" in response.json["error"]["details"]

def test_kpis_returns_expected_shape(client, sample_data):
    """KPI endpoint returns all required metrics."""
    response = client.get("/api/analytics/kpis")

    assert response.status_code == 200
    data = response.json["data"]
    assert "total_revenue" in data
    assert "avg_order_value" in data
    assert isinstance(data["total_revenue"], (int, float))
```

### Frontend Tests (TypeScript/Vitest)

```typescript
// features/dashboard/components/__tests__/KPICard.test.tsx

import { render, screen } from '@testing-library/react';
import { KPICard } from '../KPICard';

describe('KPICard', () => {
  it('renders formatted value', () => {
    render(<KPICard label="Revenue" value={150000} format="currency" />);

    expect(screen.getByText('$150,000')).toBeInTheDocument();
  });

  it('shows skeleton when loading', () => {
    render(<KPICard label="Revenue" value={null} isLoading />);

    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('displays trend indicator', () => {
    render(<KPICard label="Revenue" value={100} trend={12.5} />);

    expect(screen.getByText('+12.5%')).toHaveClass('text-green-500');
  });
});
```

```typescript
// features/filters/__tests__/useFilters.test.tsx

import { renderHook, act } from '@testing-library/react';
import { useFilters } from '../hooks/useFilters';

describe('useFilters', () => {
  it('debounces filter changes', async () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.setFilter('region', 'North');
      result.current.setFilter('region', 'South');
      result.current.setFilter('region', 'East');
    });

    // Only last value should be applied after debounce
    await waitFor(() => {
      expect(result.current.filters.region).toBe('East');
    });
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/dashboard-flow.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from '@/features/dashboard';
import { server } from '@/mocks/server';

describe('Dashboard Integration', () => {
  it('filters update all charts simultaneously', async () => {
    render(<Dashboard />);

    // Wait for initial data load
    await screen.findByTestId('revenue-chart');

    // Apply filter
    await userEvent.click(screen.getByRole('combobox', { name: /region/i }));
    await userEvent.click(screen.getByText('North'));

    // Verify all components updated
    await waitFor(() => {
      expect(screen.getByTestId('revenue-chart')).toHaveAttribute('data-region', 'North');
      expect(screen.getByTestId('kpi-grid')).toHaveAttribute('data-filtered', 'true');
    });
  });
});
```

### Test Organization

```
__tests__/
├── unit/                        # Isolated function tests
├── integration/                 # Multi-component tests
├── api/                         # Backend endpoint tests
└── e2e/                         # Full user flow tests (Playwright)
```

### Coverage Targets

| Type | Target | Rationale |
|------|--------|-----------|
| Data transformations | 90%+ | Core business logic |
| API endpoints | 80%+ | Contract validation |
| UI components | 70%+ | Rendering correctness |
| Hooks | 80%+ | State logic |
| E2E critical paths | 100% | User-facing flows |

---

## Quick Reference

### Before Every PR

**VSA Compliance**
- [ ] Feature code lives in `features/{feature-name}/`
- [ ] No imports from other feature directories
- [ ] Only `index.ts` exports are public
- [ ] Shared code moved only if 3+ features need it

**Code Quality**
- [ ] No hard-coded data values
- [ ] Polars lazy evaluation used where possible
- [ ] TypeScript strict mode passes
- [ ] Unit tests for new logic
- [ ] Structured logging for new endpoints
- [ ] API responses follow standard shape
- [ ] Loading/error states handled

**Multi-Tenancy**
- [ ] All queries include tenant filter
- [ ] Cache keys prefixed with tenant ID
- [ ] Logs include tenant context
- [ ] No cross-tenant data leakage

### Performance Checklist (100K Rows Target)

- [ ] Queries under 50ms for 100K rows
- [ ] Full dataset loads without pagination
- [ ] Bundle size impact assessed
- [ ] Skeleton loaders for async content
- [ ] Debounced user inputs (300ms)
- [ ] Memoized expensive computations
- [ ] Polars `lazy()` before `collect()`

### Export Checklist

- [ ] CSV: Uses Polars native `write_csv()`
- [ ] Excel: Uses `write_excel()` with proper formatting
- [ ] PDF: Includes title, timestamp, tenant branding
- [ ] All exports respect active filters
- [ ] Download triggers immediately (no page reload)
