# Dashboard Sections

Collection of dashboard section components for the Le Tip Lead System.

## Components

### MyLeadsSection

A comprehensive lead tracking component displaying trend data with an interactive chart and statistics.

**Features:**
- Line/Area chart showing lead trends over time
- Period selector (24h, Week, Month)
- Animated statistics using NumberTicker
- Trend indicator showing percentage change
- Mini stats row with Total, Enriched, and Pending counts
- Real-time updates via react-query
- Glassmorphism design with hover effects
- Responsive layout

**Usage:**
```tsx
import { MyLeadsSection } from '@/components/dashboard/sections';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <MyLeadsSection />
    </div>
  );
}
```

**Props:**
None - component is self-contained with internal state management

**Data Sources:**
- Currently uses mock data generators
- Ready for API integration via react-query hooks
- Refetches every 60 seconds

**Design Tokens:**
- Background: `var(--bg-card)` with glass effect
- Text: `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`
- Accent: `var(--accent-purple)`, `var(--accent-blue)`
- Border: `var(--border-default)`, `var(--border-accent)`

**Chart Configuration:**
- Purple gradient for total leads (30% color rule)
- Blue gradient for enriched leads (30% color rule)
- Custom tooltip with glassmorphism
- Responsive container that adapts to parent width

**Animations:**
- Entrance: BlurFade with 0.2s delay
- Hover: Scale to 1.005x with spring animation
- Numbers: Animated counting via NumberTicker

**Accessibility:**
- Semantic HTML structure
- ARIA-compatible chart labels
- Keyboard-accessible tabs
- Focus states on all interactive elements

### API Integration (Future)

To connect to real data, replace the mock data generators:

```tsx
// Replace generateMockData with real API call
async function fetchLeadTrend(period: Period): Promise<LeadData[]> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/leads/trend?period=${period}`
  );
  if (!response.ok) throw new Error('Failed to fetch lead trend');
  return response.json();
}

// In component
const { data: leadData } = useQuery({
  queryKey: ['leads-trend', selectedPeriod],
  queryFn: () => fetchLeadTrend(selectedPeriod),
  refetchInterval: 60000,
});
```

### Performance Considerations

**Optimizations:**
- Chart data memoized via react-query
- Lazy loading via BlurFade (only animates when in view)
- Framer Motion spring animations are GPU-accelerated
- NumberTicker uses transform for smooth counting
- Responsive container prevents layout shifts

**Performance Budget:**
- Component render: <50ms
- Chart render: <100ms
- Animation frame rate: 60fps
- Total bundle size: ~15KB (gzipped)

### Testing Checklist

- [ ] Component renders without errors
- [ ] Period selector changes data correctly
- [ ] Chart displays all data points
- [ ] Trend indicator shows correct direction
- [ ] NumberTicker animates smoothly
- [ ] Hover effects work on card
- [ ] Tooltip appears on chart hover
- [ ] Responsive layout on mobile/tablet/desktop
- [ ] Dark mode styling correct
- [ ] Accessible via keyboard navigation

---

## Other Sections

### PipelineOverviewSection
Shows business enrichment pipeline stages with progress indicators.

### RecentBusinessesTable
Displays recent business leads in a sortable, filterable table.

### TopBusinessesGrid
Grid layout of top performing businesses with enrichment status.

---

## Adding New Sections

1. Create component file in this directory
2. Follow naming convention: `{name}-section.tsx`
3. Export from `index.ts`
4. Use existing design tokens from `globals.css`
5. Integrate with chart-config for consistency
6. Add BlurFade for entrance animations
7. Use Card with `variant="glass"` for glassmorphism
8. Document in this README

---

## File Structure

```
sections/
├── index.ts                        # Barrel exports
├── my-leads-section.tsx            # Lead trend chart
├── pipeline-overview-section.tsx   # Pipeline stages
├── recent-businesses-table.tsx     # Business table
├── top-businesses-grid.tsx         # Business grid
└── README.md                       # This file
```
