'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { Market } from '@/types';

interface MarketCardProps {
  market: Market;
  isSelected: boolean;
  onSelect: (market: Market) => void;
}

export default function MarketCard({
  market,
  isSelected,
  onSelect,
}: MarketCardProps) {
  const [imgError, setImgError] = useState(false);
  const outcomes =
    Array.isArray(market.outcomes) && market.outcomes.length > 0
      ? market.outcomes
      : ['YES', 'NO'];
  const label1 = outcomes[0] || 'YES';
  const label2 = outcomes[1] || 'NO';

  const price1 = market.outcomePrices?.[0] ?? 0.5;
  const price2 = market.outcomePrices?.[1] ?? (1 - price1);
  const cents1 = (price1 * 100).toFixed(0);
  const cents2 = (price2 * 100).toFixed(0);

  const formatVolume = (vol: number): string => {
    if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
    if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
    return `$${vol.toFixed(0)}`;
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const showImage = Boolean(market.image && !imgError);

  // ── Extract specific outcome choice vs parent event context ──────────
  let parentSubtitle: string | null = null;
  let primaryTitle: string = market.question;

  if (market.groupItemTitle) {
    primaryTitle = market.groupItemTitle;
    parentSubtitle =
      market.eventTitle ||
      (market.question.includes(':') ? market.question.split(':')[0].trim() : null);
  } else if (market.eventTitle && market.question !== market.eventTitle) {
    parentSubtitle = market.eventTitle;
    const cleanEvent = market.eventTitle.replace(/[\?:!.]+$/, '').trim().toLowerCase();
    if (market.question.toLowerCase().startsWith(cleanEvent)) {
      const suffix = market.question.slice(cleanEvent.length).replace(/^[:\s-]+/, '').trim();
      if (suffix) {
        primaryTitle = suffix;
      }
    } else if (market.question.includes(': ')) {
      const parts = market.question.split(': ');
      parentSubtitle = parts[0].trim();
      primaryTitle = parts.slice(1).join(': ').trim();
    }
  } else if (market.question.includes(': ')) {
    const parts = market.question.split(': ');
    if (parts.length >= 2 && parts[1].trim().length > 0) {
      parentSubtitle = parts[0].trim();
      primaryTitle = parts.slice(1).join(': ').trim();
    }
  }

  // Ticker abbreviation for thumbnail fallback
  const fallbackTicker = (parentSubtitle || primaryTitle)
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .slice(0, 3)
    .toUpperCase();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(market)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(market);
        }
      }}
      className={cn(
        'bg-white squircle p-4 apple-shadow relative cursor-pointer flex flex-col justify-between space-y-3.5 transition-all',
        isSelected
          ? 'border-2 border-[#0071e3] shadow-[0_4px_20px_rgba(0,113,227,0.12)]'
          : 'border border-[#e5e5ea] hover:border-[#c7c7cc] apple-shadow-hover',
      )}
    >
      {/* Active Focus Pill when Selected */}
      {isSelected && (
        <div className="absolute -top-2.5 right-3 bg-[#0071e3] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
          Active Focus
        </div>
      )}

      {/* Main Content Area */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          {/* Squircle Thumbnail */}
          <div className="relative shrink-0">
            {showImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={market.image!}
                alt=""
                onError={() => setImgError(true)}
                className="w-10 h-10 rounded-[12px] object-cover border border-[#e5e5ea] shadow-inner"
              />
            ) : (
              <div className="w-10 h-10 rounded-[12px] bg-gradient-to-tr from-[#1c3d5a] to-[#2563eb] flex items-center justify-center text-white font-bold text-xs shadow-inner">
                {fallbackTicker || 'PM'}
              </div>
            )}
          </div>

          {/* Two-line Title Hierarchy */}
          <div className="flex-1 min-w-0 pr-2">
            {parentSubtitle && (
              <span
                className="block text-[11px] font-medium text-[#86868b] truncate"
                title={parentSubtitle}
              >
                {parentSubtitle}
              </span>
            )}
            <h3 className="text-sm font-bold text-[#111113] leading-snug tracking-tight line-clamp-2">
              {primaryTitle}
            </h3>
          </div>
        </div>

        {/* Clean Metrics Row */}
        <div className="flex items-center justify-between text-[11px] text-[#6e6e73]">
          <span className="px-2 py-0.5 rounded bg-[#f2f2f7] font-medium">
            {formatVolume(market.volume)} Vol
          </span>
          {market.endDate && (
            <span className="text-[#86868b]">
              Resolves {formatDate(market.endDate)}
            </span>
          )}
        </div>
      </div>

      {/* Probability Outcome Pills (Dynamic Outcomes) */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="bg-zinc-100/80 hover:bg-zinc-100 border border-zinc-200/60 px-3 py-1.5 rounded-lg flex items-center justify-between transition-colors min-w-0">
          <span className="text-emerald-600 font-semibold text-xs tracking-tight truncate pr-1">
            {label1}
          </span>
          <span className="text-emerald-600 font-mono font-semibold text-xs tracking-tight shrink-0">
            {cents1}¢
          </span>
        </div>
        <div className="bg-zinc-100/80 hover:bg-zinc-100 border border-zinc-200/60 px-3 py-1.5 rounded-lg flex items-center justify-between transition-colors min-w-0">
          <span className="text-rose-600 font-semibold text-xs tracking-tight truncate pr-1">
            {label2}
          </span>
          <span className="text-rose-600 font-mono font-semibold text-xs tracking-tight shrink-0">
            {cents2}¢
          </span>
        </div>
      </div>
    </div>
  );
}
