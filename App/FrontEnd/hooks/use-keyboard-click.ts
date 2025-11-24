/**
 * useKeyboardClick Hook
 *
 * Provides keyboard accessibility for clickable elements following WCAG guidelines.
 * Handles Enter and Space key presses to trigger click handlers.
 *
 * @param onClick - Optional click handler function
 * @returns Keyboard event handler function
 *
 * WCAG 2.1 Compliance:
 * - 2.1.1 Keyboard (Level A): All functionality available via keyboard
 * - 2.1.3 Keyboard (No Exception) (Level AAA): Full keyboard access
 *
 * Usage:
 * ```tsx
 * function MyComponent({ onClick }: { onClick?: () => void }) {
 *   const handleKeyDown = useKeyboardClick(onClick);
 *
 *   return (
 *     <div onClick={onClick} onKeyDown={handleKeyDown} tabIndex={0}>
 *       Clickable Content
 *     </div>
 *   );
 * }
 * ```
 */

import { useCallback } from 'react';

export function useKeyboardClick(onClick?: React.MouseEventHandler) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick(e as any);
      }
    },
    [onClick]
  );

  return handleKeyDown;
}
