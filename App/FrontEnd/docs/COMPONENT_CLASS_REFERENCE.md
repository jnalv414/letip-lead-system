# Component Class Reference

Quick reference for all Tailwind CSS classes used in Badge and Card components.

## Badge Component

### Variants

#### Orange (Primary Accent - 10% Rule)
```tsx
<Badge variant="orange">Label</Badge>
```
**Classes:** `bg-orange/20 text-orange border border-orange/40 hover:bg-orange/30`

#### Teal (Secondary - 30% Rule)
```tsx
<Badge variant="teal">Label</Badge>
```
**Classes:** `bg-teal-light/20 text-teal-lighter border border-teal-light/40 hover:bg-teal-light/30`

#### Charcoal (Neutral - 60% Rule)
```tsx
<Badge variant="charcoal">Label</Badge>
```
**Classes:** `bg-charcoal-light text-gray-300 border border-gray-700 hover:bg-charcoal`

#### Outline
```tsx
<Badge variant="outline">Label</Badge>
```
**Classes:** `border border-orange/40 text-orange bg-transparent hover:bg-orange/10`

#### Success
```tsx
<Badge variant="success">Label</Badge>
```
**Classes:** `bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30`

#### Warning
```tsx
<Badge variant="warning">Label</Badge>
```
**Classes:** `bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/30`

#### Error
```tsx
<Badge variant="error">Label</Badge>
```
**Classes:** `bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30`

#### Info
```tsx
<Badge variant="info">Label</Badge>
```
**Classes:** `bg-blue-500/20 text-blue-400 border border-blue-500/40 hover:bg-blue-500/30`

### Sizes

#### Small
```tsx
<Badge size="sm">Label</Badge>
```
**Classes:** `px-2 py-0.5 text-[10px]`

#### Medium (Default)
```tsx
<Badge size="md">Label</Badge>
```
**Classes:** `px-3 py-1 text-xs`

#### Large
```tsx
<Badge size="lg">Label</Badge>
```
**Classes:** `px-4 py-1.5 text-sm`

### Base Classes (All Variants)
```
inline-flex items-center gap-1 rounded-full font-semibold transition-all duration-200
```

---

## Card Component

### Variants

#### Default (Charcoal - 60% Rule)
```tsx
<Card variant="default">Content</Card>
```
**Classes:** `bg-charcoal-light border-orange/20`

#### Teal (30% Rule)
```tsx
<Card variant="teal">Content</Card>
```
**Classes:** `bg-teal border-orange/20`

#### Charcoal Dark
```tsx
<Card variant="charcoal">Content</Card>
```
**Classes:** `bg-charcoal border-orange/10`

### Base Classes (All Variants)
```
rounded-3xl p-6 border shadow-xl transition-all duration-300
```

### Hover Classes (Optional)
```tsx
<Card hover>Content</Card>
```
**Classes:** `hover:border-orange/40 hover:shadow-3d-hover hover:-translate-y-1`

### Animation Classes (Optional)
```tsx
<Card animated>Content</Card>
```
**Framer Motion:** `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`

---

## Subcomponents

### CardHeader
```
flex flex-col space-y-1.5 mb-6
```

### CardTitle
```
text-xl font-semibold text-white tracking-tight
```

### CardDescription
```
text-sm text-gray-400
```

### CardContent
```
(no default classes - user defined)
```

### CardFooter
```
flex items-center mt-6 pt-6 border-t border-orange/10
```

---

## Testing Reference

### How to Test Classes

```typescript
import { render, screen } from '@/__tests__/setup/test-utils';
import { Badge } from '@/components/ui/badge';

it('should render with correct classes', () => {
  render(<Badge variant="orange" size="lg">Test</Badge>);
  const badge = screen.getByText('Test');

  // Test all relevant classes
  expect(badge).toHaveClass(
    'bg-orange/20',
    'text-orange',
    'border-orange/40',
    'px-4',
    'py-1.5',
    'text-sm'
  );
});
```

### Common Pitfalls

1. **Don't test partial classes:**
   ```typescript
   // ❌ Wrong
   expect(badge).toHaveClass('bg-orange');

   // ✅ Correct
   expect(badge).toHaveClass('bg-orange/20');
   ```

2. **Include all variant-specific classes:**
   ```typescript
   // ❌ Incomplete
   expect(badge).toHaveClass('bg-green-500/20');

   // ✅ Complete
   expect(badge).toHaveClass('bg-green-500/20', 'text-green-400', 'border-green-500/40');
   ```

3. **Use exact class names from component:**
   ```typescript
   // Component uses: text-[10px]

   // ❌ Wrong
   expect(badge).toHaveClass('text-xs');

   // ✅ Correct
   expect(badge).toHaveClass('text-[10px]');
   ```

---

## Color Values (for Visual Validation)

### Charcoal (60%)
- Primary: `#1F2937` / `rgb(31, 41, 55)`
- Light: `#1A1A1D` / `rgb(26, 26, 29)`
- Secondary: `#111827` / `rgb(17, 24, 39)`

### Teal (30%)
- Primary: `#14B8A6` / `rgb(20, 184, 166)`
- Light: `#0D3B3B` / `rgb(13, 59, 59)`
- Lighter: `#145A5A` / `rgb(20, 90, 90)`
- Accent: `#5EEAD4` / `rgb(94, 234, 212)`

### Orange (10%)
- Primary: `#FB923C` / `rgb(251, 146, 60)`
- Dark: `#FF5722` / `rgb(255, 87, 34)`
- Secondary: `#EA580C` / `rgb(234, 88, 12)`
- Accent: `#FED7AA` / `rgb(254, 215, 170)`

### Status Colors
- Success: `#22C55E` / `rgb(34, 197, 94)`
- Warning: `#EAB308` / `rgb(234, 179, 8)`
- Error: `#EF4444` / `rgb(239, 68, 68)`
- Info: `#3B82F6` / `rgb(59, 130, 246)`

---

## Quick Test Template

```typescript
describe('MyComponent', () => {
  it('should render [variant] variant', () => {
    render(<Badge variant="[variant]">[Text]</Badge>);
    const badge = screen.getByText('[Text]');

    expect(badge).toHaveClass(
      'bg-[color]/20',
      'text-[color]',
      'border-[color]/40'
    );
  });

  it('should render [size] size', () => {
    render(<Badge size="[size]">[Text]</Badge>);
    const badge = screen.getByText('[Text]');

    expect(badge).toHaveClass(
      'px-[X]',
      'py-[Y]',
      'text-[size]'
    );
  });
});
```

---

**Last Updated:** 2025-11-22
