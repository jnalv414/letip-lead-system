'use client';

import { cn } from '@/lib/utils';

interface LeTipLogoProps {
  size?: number;
  className?: string;
}

export function LeTipLogo({ size = 56, className }: LeTipLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('flex-shrink-0', className)}
    >
      {/* Outer dark navy ring */}
      <circle cx="100" cy="100" r="98" fill="#0f172a" stroke="#1e3a5f" strokeWidth="2" />

      {/* Inner blue circle with diagonal stripes */}
      <defs>
        <clipPath id="innerCircle">
          <circle cx="100" cy="100" r="70" />
        </clipPath>
        <pattern id="diagonalStripes" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
          <rect width="4" height="8" fill="#2563eb" />
          <rect x="4" width="4" height="8" fill="#1d4ed8" />
        </pattern>
      </defs>

      {/* Blue striped inner circle */}
      <circle cx="100" cy="100" r="70" fill="url(#diagonalStripes)" />

      {/* Curved text - WESTERN MONMOUTH (top) */}
      <defs>
        <path id="topTextPath" d="M 100,100 m -78,0 a 78,78 0 1,1 156,0" fill="none" />
        <path id="bottomTextPath" d="M 100,100 m 78,0 a 78,78 0 1,1 -156,0" fill="none" />
      </defs>

      <text fill="white" fontSize="14" fontWeight="700" fontFamily="system-ui, sans-serif" letterSpacing="3">
        <textPath href="#topTextPath" startOffset="50%" textAnchor="middle">
          WESTERN MONMOUTH
        </textPath>
      </text>

      <text fill="white" fontSize="14" fontWeight="700" fontFamily="system-ui, sans-serif" letterSpacing="3">
        <textPath href="#bottomTextPath" startOffset="50%" textAnchor="middle">
          WESTERN MONMOUTH
        </textPath>
      </text>

      {/* Bullet separators */}
      <circle cx="22" cy="100" r="3" fill="white" />
      <circle cx="178" cy="100" r="3" fill="white" />

      {/* LeTip text */}
      <text
        x="100"
        y="95"
        textAnchor="middle"
        fill="white"
        fontSize="36"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
      >
        LeTip
      </text>

      {/* Registered trademark */}
      <text
        x="145"
        y="80"
        fill="white"
        fontSize="12"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
      >
        ®
      </text>

      {/* Tagline */}
      <text
        x="100"
        y="118"
        textAnchor="middle"
        fill="#3b82f6"
        fontSize="8"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
        letterSpacing="1"
      >
        NETWORK
      </text>
      <circle cx="77" cy="115" r="1.5" fill="#3b82f6" />
      <text
        x="100"
        y="118"
        textAnchor="middle"
        fill="#3b82f6"
        fontSize="8"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
        letterSpacing="1"
      >
        NETWORK • REFER • GROW
      </text>
    </svg>
  );
}

// Simplified version for small sizes (sidebar)
export function LeTipLogoCompact({ size = 48, className }: LeTipLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('flex-shrink-0', className)}
    >
      {/* Outer dark navy ring */}
      <circle cx="50" cy="50" r="48" fill="#0f172a" stroke="#1e3a5f" strokeWidth="2" />

      {/* Inner blue circle with diagonal stripes */}
      <defs>
        <pattern id="diagonalStripesCompact" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <rect width="3" height="6" fill="#2563eb" />
          <rect x="3" width="3" height="6" fill="#1d4ed8" />
        </pattern>
      </defs>

      {/* Blue striped inner circle */}
      <circle cx="50" cy="50" r="35" fill="url(#diagonalStripesCompact)" />

      {/* Navy outer ring for text background */}
      <circle cx="50" cy="50" r="48" fill="none" stroke="#0f172a" strokeWidth="24" />
      <circle cx="50" cy="50" r="48" fill="none" stroke="#0a1628" strokeWidth="22" />

      {/* Curved text paths */}
      <defs>
        <path id="topArc" d="M 10,50 A 40,40 0 0,1 90,50" fill="none" />
        <path id="bottomArc" d="M 90,50 A 40,40 0 0,1 10,50" fill="none" />
      </defs>

      {/* Top curved text */}
      <text fill="white" fontSize="7" fontWeight="700" fontFamily="system-ui, sans-serif" letterSpacing="2">
        <textPath href="#topArc" startOffset="50%" textAnchor="middle">
          WESTERN MONMOUTH
        </textPath>
      </text>

      {/* Bottom curved text */}
      <text fill="white" fontSize="7" fontWeight="700" fontFamily="system-ui, sans-serif" letterSpacing="2">
        <textPath href="#bottomArc" startOffset="50%" textAnchor="middle">
          WESTERN MONMOUTH
        </textPath>
      </text>

      {/* Bullet separators */}
      <circle cx="10" cy="50" r="2" fill="white" />
      <circle cx="90" cy="50" r="2" fill="white" />

      {/* LeTip text - centered */}
      <text
        x="50"
        y="52"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="16"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        LeTip
      </text>

      {/* Registered trademark */}
      <text
        x="72"
        y="44"
        fill="white"
        fontSize="6"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
      >
        ®
      </text>

      {/* Tagline - smaller */}
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fill="#60a5fa"
        fontSize="4"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
        letterSpacing="0.5"
      >
        NETWORK • REFER • GROW
      </text>
    </svg>
  );
}
