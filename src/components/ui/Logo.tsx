import React from 'react';
import { cn } from '@/lib/cn';

interface LogoProps {
  className?: string;
  size?: number | string;
  variant?: 'color' | 'monochrome' | 'terminal';
}

/**
 * Option C: The Oracle Spark & Polyline
 * Authentic geometric vector mark from the Polymarket AI Predictor Brand System 2.0.
 * Features a 45° ascending financial polyline converging into an Apple-grade 4-point Oracle Spark.
 */
export function LogoIcon({
  className,
  size = 32,
  variant = 'color',
}: LogoProps) {
  const isTerminal = variant === 'terminal';
  const isMono = variant === 'monochrome';

  const polylineBaseColor = isTerminal
    ? '#FFFFFF'
    : isMono
      ? '#1D1D1F'
      : '#1D1D1F';

  const polylineAccentColor = isTerminal
    ? '#00C7BE'
    : isMono
      ? '#1D1D1F'
      : '#0071E3';

  const sparkFill = isTerminal
    ? '#00C7BE'
    : isMono
      ? '#1D1D1F'
      : '#0071E3';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none', className)}
    >
      {/* Baseline to Inflection Polyline */}
      <path
        d="M 18 76 L 38 56 L 52 70 L 76 38"
        stroke={polylineBaseColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="7"
      />
      {/* Dynamic Upswing Segment */}
      <path
        d="M 52 70 L 76 38"
        stroke={polylineAccentColor}
        strokeLinecap="round"
        strokeWidth="7"
      />
      {/* 4-Point Diamond Oracle Spark */}
      <path
        d="M 78 22 C 78 30, 83 35, 91 35 C 83 35, 78 40, 78 48 C 78 40, 73 35, 65 35 C 73 35, 78 30, 78 22 Z"
        fill={sparkFill}
      />
    </svg>
  );
}

interface LogoLockupProps {
  className?: string;
  size?: number | string;
  showSubtitle?: boolean;
}

/**
 * Option C Horizontal Master Header Lockup:
 * [Option C LogoIcon] + POLYMARKET [AI] PREDICTOR
 */
export function LogoLockup({
  className,
  size = 30,
  showSubtitle = false,
}: LogoLockupProps) {
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <div className="w-8 h-8 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center p-1 shadow-2xs">
        <LogoIcon size={size} variant="color" />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-bold tracking-tight text-[15px] text-[#1D1D1F]">
          POLYMARKET
        </span>
        <span className="bg-[#0071E3] text-white text-[9px] font-bold px-1.5 py-0.5 rounded leading-none shadow-2xs">
          AI
        </span>
        {showSubtitle && (
          <span className="font-light tracking-wider text-[11px] text-gray-400 uppercase hidden sm:inline">
            PREDICTOR
          </span>
        )}
      </div>
    </div>
  );
}

export default LogoIcon;
