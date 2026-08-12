import React from 'react';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  animated?: boolean;
  variant?: 'dark' | 'light' | 'auto';
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  animated = true,
  variant = 'auto',
}) => {
  const sizeMap = {
    sm: { container: 'w-10 h-10 p-1', icon: 'w-8 h-8', title: 'text-xs', subtitle: 'text-[8px]' },
    md: { container: 'w-14 h-14 p-1.5', icon: 'w-12 h-12', title: 'text-sm', subtitle: 'text-[9px]' },
    lg: { container: 'w-20 h-20 p-2', icon: 'w-16 h-16', title: 'text-lg', subtitle: 'text-[10px]' },
    xl: { container: 'w-28 h-28 p-3', icon: 'w-24 h-24', title: 'text-2xl', subtitle: 'text-xs' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Icon Emblem with Crisp White/Glass Backdrop for High Contrast */}
      <div className={`relative flex items-center justify-center bg-white rounded-2xl shadow-lg shadow-black/10 border border-slate-100 group shrink-0 transition-transform duration-300 hover:scale-105 ${currentSize.container}`}>
        {/* Exact Replica Vector SVG of the Accounting Finance Here Logo */}
        <svg
          viewBox="0 0 120 125"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`relative z-10 ${currentSize.icon} drop-shadow-sm`}
        >
          {/* 1. Bar 1 (Light Green - Left) */}
          <rect
            x="36"
            y="32"
            width="13"
            height="36"
            rx="1.5"
            fill="#84CC16"
          />

          {/* 2. Bar 2 (Medium Green - Center) */}
          <rect
            x="53"
            y="16"
            width="13"
            height="52"
            rx="1.5"
            fill="#22C55E"
          />

          {/* 3. Bar 3 (Dark Green - Right) */}
          <rect
            x="70"
            y="0"
            width="13"
            height="68"
            rx="1.5"
            fill="#15803D"
          />

          {/* 4. Curved Red Swoosh Arrow */}
          <path
            d="M 20 44 C 20 64 46 74 74 56 C 82 50 88 42 94 32 L 91 45 L 106 22 L 81 23 L 88 32 C 82 38 76 46 68 50 C 46 64 28 56 20 44 Z"
            fill="#DC2626"
          />

          {/* 5. Navy Blue Crescent Base Arc */}
          <path
            d="M 34 64 C 48 78 74 76 88 58 C 82 72 52 83 34 64 Z"
            fill="#0F294A"
          />

          {/* 6. Vector Brand Typography Inside SVG */}
          <text
            x="60"
            y="100"
            textAnchor="middle"
            fill="#0F294A"
            fontWeight="900"
            fontSize="12.5"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="0.2"
          >
            ACCOUNTING
          </text>

          <text
            x="60"
            y="114"
            textAnchor="middle"
            fill="#DC2626"
            fontWeight="800"
            fontSize="8"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="1.2"
          >
            FINANCE HERE
          </text>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span className={`font-black tracking-tight font-sans text-slate-900 uppercase leading-none ${currentSize.title}`}>
            ACCOUNTING
          </span>
          <span className={`font-bold font-sans text-red-600 tracking-[0.2em] uppercase mt-1 leading-none ${currentSize.subtitle}`}>
            FINANCE HERE
          </span>
        </div>
      )}
    </div>
  );
};


