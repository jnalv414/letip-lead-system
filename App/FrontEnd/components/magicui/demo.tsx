'use client';

/**
 * Magic-UI Components Demo
 *
 * Usage examples for all Magic-UI animation components.
 * Import this component to test all animations.
 */

import {
  ShineBorder,
  ShimmerButton,
  AnimatedList,
  BlurFade,
  NumberTicker,
  BentoGrid,
  BentoGridItem,
} from './index';

export function MagicUIDemo() {
  const sampleItems = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];

  return (
    <div className="space-y-12 p-8">
      {/* ShineBorder Demo */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Shine Border</h2>
        <ShineBorder className="max-w-md">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2">Featured Card</h3>
            <p className="text-muted-foreground">
              This card has an animated gradient border that shines continuously.
            </p>
          </div>
        </ShineBorder>
      </section>

      {/* ShimmerButton Demo */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Shimmer Button</h2>
        <div className="flex gap-4">
          <ShimmerButton onClick={() => alert('Clicked!')}>
            Click Me
          </ShimmerButton>
          <ShimmerButton disabled>
            Disabled
          </ShimmerButton>
        </div>
      </section>

      {/* BlurFade Demo */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Blur Fade</h2>
        <div className="space-y-4">
          <BlurFade delay={0}>
            <div className="p-4 bg-[var(--bg-card)] rounded-lg">
              First item (no delay)
            </div>
          </BlurFade>
          <BlurFade delay={0.2}>
            <div className="p-4 bg-[var(--bg-card)] rounded-lg">
              Second item (0.2s delay)
            </div>
          </BlurFade>
          <BlurFade delay={0.4}>
            <div className="p-4 bg-[var(--bg-card)] rounded-lg">
              Third item (0.4s delay)
            </div>
          </BlurFade>
        </div>
      </section>

      {/* NumberTicker Demo */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Number Ticker</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-6 bg-[var(--bg-card)] rounded-lg text-center">
            <NumberTicker
              value={1234}
              className="text-4xl font-bold text-violet-500"
            />
            <p className="text-sm text-muted-foreground mt-2">Total Businesses</p>
          </div>
          <div className="p-6 bg-[var(--bg-card)] rounded-lg text-center">
            <NumberTicker
              value={98.5}
              decimalPlaces={1}
              suffix="%"
              className="text-4xl font-bold text-blue-500"
            />
            <p className="text-sm text-muted-foreground mt-2">Success Rate</p>
          </div>
          <div className="p-6 bg-[var(--bg-card)] rounded-lg text-center">
            <NumberTicker
              value={45678}
              prefix="$"
              className="text-4xl font-bold text-cyan-500"
            />
            <p className="text-sm text-muted-foreground mt-2">Revenue</p>
          </div>
        </div>
      </section>

      {/* AnimatedList Demo */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Animated List</h2>
        <AnimatedList className="space-y-2">
          {sampleItems.map((item) => (
            <div
              key={item}
              className="p-4 bg-[var(--bg-card)] rounded-lg"
            >
              {item}
            </div>
          ))}
        </AnimatedList>
      </section>

      {/* BentoGrid Demo */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Bento Grid</h2>
        <BentoGrid>
          <BentoGridItem colSpan={2}>
            <h3 className="text-lg font-semibold">Wide Card</h3>
            <p className="text-sm text-muted-foreground mt-2">
              This card spans 2 columns
            </p>
          </BentoGridItem>
          <BentoGridItem>
            <h3 className="text-lg font-semibold">Regular Card</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Single column
            </p>
          </BentoGridItem>
          <BentoGridItem>
            <h3 className="text-lg font-semibold">Regular Card</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Single column
            </p>
          </BentoGridItem>
          <BentoGridItem rowSpan={2}>
            <h3 className="text-lg font-semibold">Tall Card</h3>
            <p className="text-sm text-muted-foreground mt-2">
              This card spans 2 rows
            </p>
          </BentoGridItem>
          <BentoGridItem>
            <h3 className="text-lg font-semibold">Regular Card</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Single column
            </p>
          </BentoGridItem>
          <BentoGridItem colSpan={3}>
            <h3 className="text-lg font-semibold">Extra Wide Card</h3>
            <p className="text-sm text-muted-foreground mt-2">
              This card spans 3 columns
            </p>
          </BentoGridItem>
        </BentoGrid>
      </section>
    </div>
  );
}
