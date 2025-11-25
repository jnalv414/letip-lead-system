# Magic-UI Animation Components

Modern, reusable animation components for the Le Tip Lead System dashboard, inspired by Magic-UI.

## Components

### 1. ShineBorder

Animated gradient border that creates a shining effect around cards and containers.

**Props:**
- `children: ReactNode` - Content to wrap
- `className?: string` - Additional CSS classes
- `borderWidth?: number` - Border width in pixels (default: 1)
- `duration?: number` - Animation duration in seconds (default: 8)
- `color?: string | string[]` - Gradient colors (default: ['#8B5CF6', '#3B82F6', '#06B6D4'])

**Example:**
```tsx
import { ShineBorder } from '@/components/magicui';

<ShineBorder
  className="max-w-md"
  borderWidth={2}
  duration={6}
  color={['#8B5CF6', '#EC4899']}
>
  <div className="p-6">
    <h3>Featured Business</h3>
    <p>Premium listing with animated border</p>
  </div>
</ShineBorder>
```

---

### 2. ShimmerButton

Button with animated shimmer effect for primary CTAs.

**Props:**
- `children: ReactNode` - Button content
- `className?: string` - Additional CSS classes
- `onClick?: () => void` - Click handler
- `disabled?: boolean` - Disabled state

**Example:**
```tsx
import { ShimmerButton } from '@/components/magicui';

<ShimmerButton
  onClick={() => handleEnrich(businessId)}
  disabled={isLoading}
>
  Enrich Business
</ShimmerButton>
```

---

### 3. AnimatedList

Staggered list animations with enter/exit transitions.

**Props:**
- `children: ReactNode[]` - Array of list items
- `className?: string` - Additional CSS classes
- `delay?: number` - Delay between items in seconds (default: 0.1)

**Example:**
```tsx
import { AnimatedList } from '@/components/magicui';

<AnimatedList delay={0.1} className="space-y-2">
  {businesses.map((business) => (
    <BusinessCard key={business.id} business={business} />
  ))}
</AnimatedList>
```

**AnimatedListItem:**
Wrap individual items for more control:

```tsx
import { AnimatedListItem } from '@/components/magicui';

{businesses.map((business) => (
  <AnimatedListItem key={business.id}>
    <BusinessCard business={business} />
  </AnimatedListItem>
))}
```

---

### 4. BlurFade

Fade-in with blur effect for section entrances. Triggers when element enters viewport.

**Props:**
- `children: ReactNode` - Content to animate
- `className?: string` - Additional CSS classes
- `delay?: number` - Delay before animation starts (default: 0)
- `duration?: number` - Animation duration in seconds (default: 0.4)
- `yOffset?: number` - Vertical offset in pixels (default: 8)
- `inView?: boolean` - Trigger only when in viewport (default: true)

**Example:**
```tsx
import { BlurFade } from '@/components/magicui';

<BlurFade delay={0.2} duration={0.6}>
  <StatsCard title="Total Businesses" value={1234} />
</BlurFade>
```

**Stagger multiple elements:**
```tsx
{['Card 1', 'Card 2', 'Card 3'].map((title, index) => (
  <BlurFade key={title} delay={index * 0.1}>
    <div>{title}</div>
  </BlurFade>
))}
```

---

### 5. NumberTicker

Animated number counting for metrics and statistics.

**Props:**
- `value: number` - Target number to count to
- `className?: string` - Additional CSS classes
- `delay?: number` - Delay before counting starts (default: 0)
- `decimalPlaces?: number` - Number of decimal places (default: 0)
- `prefix?: string` - Text before number (e.g., '$')
- `suffix?: string` - Text after number (e.g., '%')

**Example:**
```tsx
import { NumberTicker } from '@/components/magicui';

// Integer
<NumberTicker
  value={1234}
  className="text-4xl font-bold text-violet-500"
/>

// Currency
<NumberTicker
  value={45678}
  prefix="$"
  className="text-4xl font-bold"
/>

// Percentage
<NumberTicker
  value={98.5}
  decimalPlaces={1}
  suffix="%"
  className="text-4xl font-bold"
/>
```

---

### 6. BentoGrid

Flexible responsive grid layout for cards (inspired by Bento UI).

**BentoGrid Props:**
- `children: ReactNode` - Grid items
- `className?: string` - Additional CSS classes

**BentoGridItem Props:**
- `children: ReactNode` - Item content
- `className?: string` - Additional CSS classes
- `colSpan?: 1 | 2 | 3 | 4` - Column span (default: 1)
- `rowSpan?: 1 | 2` - Row span (default: 1)

**Example:**
```tsx
import { BentoGrid, BentoGridItem } from '@/components/magicui';

<BentoGrid>
  {/* Wide featured card */}
  <BentoGridItem colSpan={2}>
    <FeaturedBusinessCard />
  </BentoGridItem>

  {/* Regular cards */}
  <BentoGridItem>
    <StatsCard />
  </BentoGridItem>
  <BentoGridItem>
    <StatsCard />
  </BentoGridItem>

  {/* Tall card */}
  <BentoGridItem rowSpan={2}>
    <ActivityFeed />
  </BentoGridItem>

  {/* Extra wide card */}
  <BentoGridItem colSpan={3}>
    <ChartCard />
  </BentoGridItem>
</BentoGrid>
```

---

## Installation

All components are already installed in the project. Import from the barrel export:

```tsx
import {
  ShineBorder,
  ShimmerButton,
  AnimatedList,
  AnimatedListItem,
  BlurFade,
  NumberTicker,
  BentoGrid,
  BentoGridItem,
} from '@/components/magicui';
```

---

## Dependencies

- `framer-motion` - Core animation library
- `@/lib/utils` - Utility functions (cn for className merging)
- Tailwind CSS - Styling
- CSS Variables - Theme integration

---

## Performance Considerations

### Reduce Motion
All animations respect `prefers-reduced-motion` media query via global CSS:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Lazy Loading
For pages with many animations, consider dynamic imports:

```tsx
import dynamic from 'next/dynamic';

const AnimatedSection = dynamic(
  () => import('@/components/dashboard/animated-section'),
  { ssr: false }
);
```

### Animation Best Practices
1. Use `AnimatePresence` for exit animations
2. Set `layoutId` for shared element transitions
3. Use `useInView` to trigger animations only when visible
4. Avoid animating `width`/`height` - use `transform: scale()` instead
5. Batch multiple animations together

---

## Usage Examples

### Dashboard Stats Section
```tsx
import { BlurFade, NumberTicker } from '@/components/magicui';

export function DashboardStats() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: 'Total Businesses', value: 1234, color: 'violet' },
        { label: 'Enriched', value: 856, color: 'blue' },
        { label: 'Pending', value: 378, color: 'cyan' },
      ].map((stat, index) => (
        <BlurFade key={stat.label} delay={index * 0.1}>
          <div className="p-6 bg-[var(--bg-card)] rounded-lg">
            <NumberTicker
              value={stat.value}
              className={`text-4xl font-bold text-${stat.color}-500`}
            />
            <p className="text-sm text-muted-foreground mt-2">
              {stat.label}
            </p>
          </div>
        </BlurFade>
      ))}
    </div>
  );
}
```

### Featured Business Card
```tsx
import { ShineBorder } from '@/components/magicui';

export function FeaturedBusiness({ business }) {
  return (
    <ShineBorder borderWidth={2} duration={6}>
      <div className="p-6">
        <h3 className="text-xl font-bold">{business.name}</h3>
        <p className="text-muted-foreground">{business.city}</p>
        <div className="mt-4 flex gap-2">
          <Badge>{business.industry}</Badge>
          <Badge variant="outline">{business.enrichment_status}</Badge>
        </div>
      </div>
    </ShineBorder>
  );
}
```

### Business List with Animations
```tsx
import { AnimatedList } from '@/components/magicui';

export function BusinessList({ businesses }) {
  return (
    <AnimatedList delay={0.05} className="space-y-3">
      {businesses.map((business) => (
        <BusinessCard key={business.id} business={business} />
      ))}
    </AnimatedList>
  );
}
```

### Action Button
```tsx
import { ShimmerButton } from '@/components/magicui';

export function EnrichButton({ businessId, onEnrich }) {
  return (
    <ShimmerButton
      onClick={() => onEnrich(businessId)}
      className="w-full"
    >
      Enrich Business Data
    </ShimmerButton>
  );
}
```

---

## Testing

All components are client-side components (`'use client'`) and work with:
- React 19.2+
- Next.js 16+
- Framer Motion 12+

To test animations:
```tsx
import { MagicUIDemo } from '@/components/magicui/demo';

// Add to a test page
export default function TestPage() {
  return <MagicUIDemo />;
}
```

---

## Troubleshooting

### Animations not working
- Check that Framer Motion is installed: `npm list framer-motion`
- Verify component has `'use client'` directive
- Check browser console for errors

### Styles not applying
- Ensure Tailwind CSS is configured correctly
- Verify CSS variables are defined in `globals.css`
- Check that `@/lib/utils` exports `cn` function

### Performance issues
- Use `will-change` CSS property sparingly
- Implement viewport-based animations with `useInView`
- Consider disabling animations on low-end devices

---

## Customization

### Theming
All components use CSS variables from `globals.css`:

```css
:root {
  --bg-card: rgba(20, 20, 30, 0.7);
  --bg-card-solid: #1a1a24;
  --accent-purple: #8B5CF6;
  --accent-blue: #3B82F6;
  --border-default: rgba(255, 255, 255, 0.1);
}
```

### Extending Components
Components are designed to be extended via `className` prop:

```tsx
<ShineBorder className="shadow-2xl hover:scale-105 transition-transform">
  {/* Your content */}
</ShineBorder>
```

### Custom Animations
Add custom Framer Motion variants:

```tsx
import { motion } from 'framer-motion';

const customVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

<motion.div
  variants={customVariants}
  initial="hidden"
  animate="visible"
>
  {/* Content */}
</motion.div>
```

---

## Files

```
components/magicui/
├── shine-border.tsx      # Animated gradient borders
├── shimmer-button.tsx    # Shimmer effect buttons
├── animated-list.tsx     # Staggered list animations
├── blur-fade.tsx         # Blur fade-in effect
├── number-ticker.tsx     # Animated number counting
├── bento-grid.tsx        # Flexible grid layout
├── index.ts              # Barrel exports
├── demo.tsx              # Demo/test component
└── README.md             # This file
```

---

## Credits

Inspired by [Magic-UI](https://magicui.design/) - Beautiful animated components for React.
