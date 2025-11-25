# Magic-UI Quick Start Guide

Get started with Magic-UI components in 5 minutes.

## Step 1: Test Components

Start your dev server and view the demo:

```bash
cd /Volumes/HOME-EX/Users/justinnalven/.claude/projects/letip-lead-system/App/FrontEnd
npm run dev
```

Create test page: `app/test/magicui/page.tsx`

```tsx
import { MagicUIDemo } from '@/components/magicui/demo';

export default function TestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Magic-UI Test</h1>
      <MagicUIDemo />
    </div>
  );
}
```

Visit: http://localhost:3001/test/magicui

---

## Step 2: Import Components

In any component file:

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

---

## Step 3: Basic Usage

### Animated Numbers

```tsx
<NumberTicker value={1234} className="text-4xl font-bold" />
```

### Animated Button

```tsx
<ShimmerButton onClick={() => console.log('clicked')}>
  Click Me
</ShimmerButton>
```

### Fade In Effect

```tsx
<BlurFade delay={0.2}>
  <div>This fades in with blur</div>
</BlurFade>
```

### Animated List

```tsx
<AnimatedList delay={0.05}>
  {items.map((item) => (
    <div key={item.id}>{item.name}</div>
  ))}
</AnimatedList>
```

### Shine Border

```tsx
<ShineBorder>
  <div className="p-6">
    Featured Content
  </div>
</ShineBorder>
```

### Bento Grid

```tsx
<BentoGrid>
  <BentoGridItem colSpan={2}>
    Wide card
  </BentoGridItem>
  <BentoGridItem>
    Regular card
  </BentoGridItem>
</BentoGrid>
```

---

## Step 4: Real-World Example

Update `components/dashboard/stats/dashboard-stats.tsx`:

```tsx
import { BlurFade, NumberTicker } from '@/components/magicui';
import { Building2, CheckCircle2, Clock, XCircle } from 'lucide-react';

export function DashboardStats({ stats }) {
  const metrics = [
    { label: 'Total', value: stats.total, icon: Building2 },
    { label: 'Enriched', value: stats.enriched, icon: CheckCircle2 },
    { label: 'Pending', value: stats.pending, icon: Clock },
    { label: 'Failed', value: stats.failed, icon: XCircle },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <BlurFade key={metric.label} delay={index * 0.1}>
          <div className="glass-elevated p-6 rounded-lg">
            <metric.icon className="h-5 w-5 text-violet-500 mb-2" />
            <NumberTicker
              value={metric.value}
              className="text-3xl font-bold text-violet-500"
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

---

## Step 5: Common Patterns

### Stats Grid with Animations

```tsx
<div className="grid grid-cols-3 gap-4">
  <BlurFade delay={0}>
    <div className="p-6 bg-[var(--bg-card)] rounded-lg">
      <NumberTicker value={1234} className="text-4xl font-bold" />
      <p>Total Businesses</p>
    </div>
  </BlurFade>
  <BlurFade delay={0.1}>
    <div className="p-6 bg-[var(--bg-card)] rounded-lg">
      <NumberTicker value={856} className="text-4xl font-bold" />
      <p>Enriched</p>
    </div>
  </BlurFade>
  <BlurFade delay={0.2}>
    <div className="p-6 bg-[var(--bg-card)] rounded-lg">
      <NumberTicker value={378} className="text-4xl font-bold" />
      <p>Pending</p>
    </div>
  </BlurFade>
</div>
```

### List with Animations

```tsx
<div className="glass-elevated p-6 rounded-lg">
  <h2 className="text-xl font-bold mb-4">Recent Businesses</h2>
  <AnimatedList delay={0.05} className="space-y-3">
    {businesses.map((business) => (
      <div
        key={business.id}
        className="p-4 bg-[var(--bg-card)] rounded-lg"
      >
        <h3 className="font-semibold">{business.name}</h3>
        <p className="text-sm text-muted-foreground">{business.city}</p>
      </div>
    ))}
  </AnimatedList>
</div>
```

### Featured Card with Shine

```tsx
<ShineBorder borderWidth={2} duration={6}>
  <div className="p-6">
    <h3 className="text-xl font-bold mb-2">Featured Business</h3>
    <p className="text-muted-foreground mb-4">
      Premium listing with special highlights
    </p>
    <ShimmerButton onClick={handleAction}>
      Take Action
    </ShimmerButton>
  </div>
</ShineBorder>
```

### Dashboard Layout

```tsx
<div className="space-y-6">
  {/* Stats */}
  <DashboardStats stats={stats} />

  {/* Bento Grid */}
  <BentoGrid>
    <BentoGridItem colSpan={2}>
      <ShineBorder>
        <FeaturedContent />
      </ShineBorder>
    </BentoGridItem>
    <BentoGridItem>
      <QuickStat />
    </BentoGridItem>
    <BentoGridItem rowSpan={2}>
      <ActivityFeed />
    </BentoGridItem>
    <BentoGridItem colSpan={3}>
      <RecentBusinesses />
    </BentoGridItem>
  </BentoGrid>
</div>
```

---

## Tips

### 1. Stagger Animations
Use incremental delays for smooth sequences:
```tsx
{items.map((item, i) => (
  <BlurFade key={item.id} delay={i * 0.1}>
    <Item {...item} />
  </BlurFade>
))}
```

### 2. Combine Components
```tsx
<ShineBorder>
  <div className="p-6">
    <NumberTicker value={1234} className="text-4xl font-bold" />
    <ShimmerButton onClick={action}>Action</ShimmerButton>
  </div>
</ShineBorder>
```

### 3. Responsive Animations
Disable on mobile if needed:
```tsx
const isMobile = window.innerWidth < 768;

{isMobile ? (
  <div>{content}</div>
) : (
  <BlurFade>{content}</BlurFade>
)}
```

### 4. Performance
Limit animated items:
```tsx
<AnimatedList>
  {businesses.slice(0, 20).map((b) => <Item key={b.id} {...b} />)}
</AnimatedList>
```

---

## Troubleshooting

**Animations not showing?**
- Check component has `'use client'` directive
- Verify Framer Motion is installed: `npm list framer-motion`
- Check browser console for errors

**Styles not applying?**
- Verify CSS animations are in `globals.css`
- Check Tailwind config includes component paths
- Ensure CSS variables are defined

**Performance issues?**
- Reduce number of animated items
- Increase delay between animations
- Disable animations on mobile devices

---

## Next Steps

1. **Test the demo**: Visit http://localhost:3001/test/magicui
2. **Read the docs**: Check `README.md` for detailed documentation
3. **Follow integration guide**: See `INTEGRATION.md` for step-by-step instructions
4. **Review summary**: Check `SUMMARY.md` for complete overview

---

## All Components at a Glance

```tsx
// Numbers
<NumberTicker value={1234} prefix="$" suffix="%" decimalPlaces={2} />

// Buttons
<ShimmerButton onClick={handler}>Click</ShimmerButton>

// Fade In
<BlurFade delay={0.2} duration={0.6}>{content}</BlurFade>

// Lists
<AnimatedList delay={0.1}>{items}</AnimatedList>

// Borders
<ShineBorder borderWidth={2} duration={8}>{content}</ShineBorder>

// Layouts
<BentoGrid>
  <BentoGridItem colSpan={2} rowSpan={1}>{content}</BentoGridItem>
</BentoGrid>
```

---

## Documentation Files

- **README.md** - Comprehensive component documentation
- **INTEGRATION.md** - Step-by-step integration guide
- **SUMMARY.md** - Implementation overview
- **QUICKSTART.md** - This file (5-minute setup)

---

## Support

Having issues? Check:
1. Demo component works: `components/magicui/demo.tsx`
2. All dependencies installed: `npm install`
3. Dev server running: `npm run dev`
4. Browser console for errors

---

**Ready to enhance your dashboard with beautiful animations!**
