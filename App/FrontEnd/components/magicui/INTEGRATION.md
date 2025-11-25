# Magic-UI Components Integration Guide

Quick guide for integrating Magic-UI animation components into the Le Tip Lead System dashboard.

## Quick Start

### 1. Import Components

```tsx
import {
  ShineBorder,
  ShimmerButton,
  AnimatedList,
  BlurFade,
  NumberTicker,
  BentoGrid,
  BentoGridItem,
} from '@/components/magicui';
```

### 2. Dashboard Stats (Replace Existing)

**File:** `components/dashboard/stats/dashboard-stats.tsx`

**Before:**
```tsx
export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Static cards */}
    </div>
  );
}
```

**After:**
```tsx
import { BlurFade, NumberTicker } from '@/components/magicui';

export function DashboardStats({ stats }: DashboardStatsProps) {
  const metrics = [
    { label: 'Total Businesses', value: stats.total, icon: Building2, color: 'violet' },
    { label: 'Enriched', value: stats.enriched, icon: CheckCircle2, color: 'blue' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'cyan' },
    { label: 'Failed', value: stats.failed, icon: XCircle, color: 'red' },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <BlurFade key={metric.label} delay={index * 0.1}>
          <div className="glass-elevated p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <metric.icon className={`h-5 w-5 text-${metric.color}-500`} />
            </div>
            <NumberTicker
              value={metric.value}
              className={`text-3xl font-bold text-${metric.color}-500`}
            />
            <p className="text-sm text-muted-foreground mt-1">
              {metric.label}
            </p>
          </div>
        </BlurFade>
      ))}
    </div>
  );
}
```

### 3. Business List with Animations

**File:** `components/dashboard/business-list.tsx`

```tsx
import { AnimatedList } from '@/components/magicui';

export function BusinessList({ businesses }: BusinessListProps) {
  return (
    <div className="glass-elevated p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Recent Businesses</h2>
      <AnimatedList delay={0.05} className="space-y-3">
        {businesses.map((business) => (
          <BusinessCard key={business.id} business={business} />
        ))}
      </AnimatedList>
    </div>
  );
}
```

### 4. Featured Business Card

**File:** `components/dashboard/featured-business.tsx`

```tsx
import { ShineBorder } from '@/components/magicui';

export function FeaturedBusiness({ business }: FeaturedBusinessProps) {
  return (
    <ShineBorder
      borderWidth={2}
      duration={6}
      color={['#8B5CF6', '#3B82F6', '#06B6D4']}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">{business.name}</h3>
            <p className="text-muted-foreground">{business.city}</p>
          </div>
          <Badge className="bg-violet-500">Featured</Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Industry:</span>
            <span>{business.industry || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Contacts:</span>
            <span>{business.contacts?.length || 0}</span>
          </div>
        </div>
      </div>
    </ShineBorder>
  );
}
```

### 5. CTA Buttons

Replace standard buttons with shimmer buttons for primary actions:

```tsx
import { ShimmerButton } from '@/components/magicui';

// Enrich button
<ShimmerButton
  onClick={() => handleEnrich(business.id)}
  disabled={isEnriching}
>
  {isEnriching ? 'Enriching...' : 'Enrich Business'}
</ShimmerButton>

// Start scraping button
<ShimmerButton
  onClick={handleStartScraping}
  className="w-full"
>
  Start Scraping
</ShimmerButton>
```

### 6. Dashboard Layout with Bento Grid

**File:** `app/dashboard/page.tsx`

```tsx
import { BentoGrid, BentoGridItem, BlurFade } from '@/components/magicui';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats section with animations */}
      <BlurFade delay={0}>
        <DashboardStats stats={stats} />
      </BlurFade>

      {/* Bento grid layout */}
      <BentoGrid>
        {/* Featured business - wide */}
        <BentoGridItem colSpan={2}>
          <FeaturedBusiness business={featuredBusiness} />
        </BentoGridItem>

        {/* Quick stats */}
        <BentoGridItem>
          <QuickStatCard title="Success Rate" value="94.2%" />
        </BentoGridItem>
        <BentoGridItem>
          <QuickStatCard title="Avg. Response Time" value="2.3s" />
        </BentoGridItem>

        {/* Activity feed - tall */}
        <BentoGridItem rowSpan={2}>
          <ActivityFeed activities={activities} />
        </BentoGridItem>

        {/* Recent businesses - extra wide */}
        <BentoGridItem colSpan={3}>
          <RecentBusinesses businesses={businesses} />
        </BentoGridItem>

        {/* Chart - full width */}
        <BentoGridItem colSpan={4}>
          <EnrichmentChart data={chartData} />
        </BentoGridItem>
      </BentoGrid>
    </div>
  );
}
```

---

## Component Mapping

### Replace These Components

| Old Component | Magic-UI Replacement | Use Case |
|---------------|---------------------|----------|
| Static `<div>` cards | `<ShineBorder>` | Featured/premium content |
| Standard `<button>` | `<ShimmerButton>` | Primary CTAs |
| Static list rendering | `<AnimatedList>` | Business lists, activity feeds |
| Immediate render | `<BlurFade>` | Section entrances, cards |
| `<span>{number}</span>` | `<NumberTicker>` | Stats, metrics, counts |
| CSS Grid | `<BentoGrid>` | Dashboard layouts |

---

## Real-Time Updates Integration

Combine Magic-UI with WebSocket updates for smooth animations:

```tsx
import { AnimatedList } from '@/components/magicui';
import { useWebSocket } from '@/hooks/use-websocket';

export function LiveBusinessFeed() {
  const { businesses } = useWebSocket();

  return (
    <div className="glass-elevated p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Live Feed</h2>
      <AnimatedList delay={0.1} className="space-y-3">
        {businesses.map((business) => (
          <div key={business.id} className="p-4 bg-[var(--bg-card)] rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{business.name}</h3>
                <p className="text-sm text-muted-foreground">{business.city}</p>
              </div>
              <Badge>{business.enrichment_status}</Badge>
            </div>
          </div>
        ))}
      </AnimatedList>
    </div>
  );
}
```

---

## Performance Tips

### 1. Lazy Load Heavy Animations
```tsx
import dynamic from 'next/dynamic';

const AnimatedSection = dynamic(
  () => import('@/components/dashboard/animated-section'),
  { ssr: false, loading: () => <div>Loading...</div> }
);
```

### 2. Limit AnimatedList Items
```tsx
// Only animate first 20 items
<AnimatedList delay={0.05}>
  {businesses.slice(0, 20).map((business) => (
    <BusinessCard key={business.id} business={business} />
  ))}
</AnimatedList>
```

### 3. Disable Animations on Mobile
```tsx
import { useMediaQuery } from '@/hooks/use-media-query';

export function ResponsiveAnimation() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return isMobile ? (
    <div>{content}</div>
  ) : (
    <BlurFade>{content}</BlurFade>
  );
}
```

---

## Testing

### 1. Test Individual Components

Create a test page: `app/test/magicui/page.tsx`

```tsx
import { MagicUIDemo } from '@/components/magicui/demo';

export default function MagicUITestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Magic-UI Components Test</h1>
      <MagicUIDemo />
    </div>
  );
}
```

Access at: http://localhost:3001/test/magicui

### 2. Test with Real Data

```tsx
import { useQuery } from '@tanstack/react-query';
import { AnimatedList, NumberTicker } from '@/components/magicui';

export function LiveDataTest() {
  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: fetchBusinesses,
  });

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-4 gap-4">
        {stats && (
          <>
            <NumberTicker value={stats.total} />
            <NumberTicker value={stats.enriched} />
            <NumberTicker value={stats.pending} />
            <NumberTicker value={stats.failed} />
          </>
        )}
      </div>

      <AnimatedList>
        {businesses?.map((business) => (
          <div key={business.id}>{business.name}</div>
        ))}
      </AnimatedList>
    </div>
  );
}
```

---

## Common Patterns

### 1. Staggered Card Grid
```tsx
import { BlurFade } from '@/components/magicui';

{cards.map((card, index) => (
  <BlurFade key={card.id} delay={index * 0.05}>
    <Card {...card} />
  </BlurFade>
))}
```

### 2. Hero Section with Delayed Elements
```tsx
<div>
  <BlurFade delay={0}>
    <h1>Welcome to Le Tip Lead System</h1>
  </BlurFade>
  <BlurFade delay={0.2}>
    <p>Automated business lead generation</p>
  </BlurFade>
  <BlurFade delay={0.4}>
    <ShimmerButton>Get Started</ShimmerButton>
  </BlurFade>
</div>
```

### 3. Loading State to Loaded State
```tsx
import { AnimatePresence, motion } from 'framer-motion';
import { AnimatedList } from '@/components/magicui';

{isLoading ? (
  <motion.div
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <Spinner />
  </motion.div>
) : (
  <AnimatedList>
    {data.map((item) => <Item key={item.id} {...item} />)}
  </AnimatedList>
)}
```

---

## Accessibility

All components follow accessibility best practices:

- **Respect reduced motion**: Animations disabled via CSS media query
- **Keyboard navigation**: All interactive components support keyboard
- **Screen readers**: Content is accessible to assistive technologies
- **Focus states**: Clear focus indicators on all interactive elements

---

## Troubleshooting

### Animations don't trigger
- Check that component is in viewport
- Verify `inView` prop is set correctly
- Use React DevTools to inspect component state

### Performance issues
- Reduce `delay` values for faster animations
- Limit number of animated items
- Use `will-change` CSS property sparingly
- Consider disabling animations on low-end devices

### Styling conflicts
- Check that Tailwind CSS classes aren't being overridden
- Verify CSS variables are defined in `globals.css`
- Use `!important` sparingly (prefer specificity)

---

## Next Steps

1. **Start with DashboardStats**: Replace static numbers with `NumberTicker`
2. **Add BlurFade to sections**: Animate cards on page load
3. **Use AnimatedList for feeds**: Add to business list and activity feed
4. **Feature cards with ShineBorder**: Highlight important businesses
5. **Replace CTAs with ShimmerButton**: Make primary actions stand out

---

## Files Modified

When integrating, you'll typically modify:

```
App/FrontEnd/
├── app/
│   └── dashboard/
│       └── page.tsx                    # Main dashboard layout
├── components/
│   └── dashboard/
│       ├── stats/
│       │   └── dashboard-stats.tsx     # Stats with NumberTicker
│       ├── business-list.tsx           # List with AnimatedList
│       └── featured-business.tsx       # Card with ShineBorder
```

---

## Support

For issues or questions:
1. Check component README: `components/magicui/README.md`
2. View demo component: `components/magicui/demo.tsx`
3. Test at: http://localhost:3001/test/magicui
4. Review Framer Motion docs: https://www.framer.com/motion/

---

## Credits

Components inspired by [Magic-UI](https://magicui.design/)
Built for Le Tip Lead System Dashboard
