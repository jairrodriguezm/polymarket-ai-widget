'use client';

import { useState } from 'react';
import {
  ExternalLink,
  ChevronDown,
  Info,
} from 'lucide-react';
import type { Market } from '@/types';

interface MarketDetailsProps {
  market: Market;
}

export default function MarketDetails({ market }: MarketDetailsProps) {
  const [imgError, setImgError] = useState(false);

  const formatVolume = (vol: number): string => {
    if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
    if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
    return `$${vol.toFixed(0)}`;
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return 'TBD';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const yesPrice = market.outcomePrices[0] ?? 0.5;
  const noPrice = market.outcomePrices[1] ?? 0.5;
  const showImage = Boolean(market.image && !imgError);

  // ── Disambiguate Sub-Market vs Parent Event ──────────
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

  const eventSlug = market.eventSlug || market.slug;

  return (
    <div className="bg-white border border-[#e5e5ea] squircle p-5 apple-shadow space-y-4">
      {/* Header & Active Selection */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-full">
              Active Selection
            </span>
            {parentSubtitle && (
              <span className="text-xs text-[#86868b] truncate max-w-[200px]" title={parentSubtitle}>
                • {parentSubtitle}
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-[#111113] tracking-tight leading-snug">
            {primaryTitle}
          </h2>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-[#86868b]">Current Spread</div>
          <div className="font-mono font-bold text-sm flex items-center justify-end gap-1">
            <span className="text-emerald-600 dark:text-emerald-400">{(yesPrice * 100).toFixed(0)}¢</span>
            <span className="text-[#86868b] font-normal">/</span>
            <span className="text-rose-600 dark:text-rose-400">{(noPrice * 100).toFixed(0)}¢</span>
          </div>
        </div>
      </div>

      {/* Volume & Resolution Stats Grid */}
      <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#f2f2f7] text-center text-xs">
        <div>
          <span className="block text-[11px] text-[#86868b]">24h Volume</span>
          <span className="font-mono font-semibold text-[#111113]">
            {formatVolume(market.volume)}
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-[#86868b]">Status</span>
          <span className="font-semibold text-[#28a745]">
            {market.closed ? 'Closed' : 'Active'}
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-[#86868b]">End Date</span>
          <span className="font-semibold text-[#111113]">
            {formatDate(market.endDate)}
          </span>
        </div>
      </div>

      {/* Collapsible Rules & Verification Disclosure */}
      <details className="group text-xs" open>
        <summary className="flex items-center justify-between font-medium text-[#6e6e73] hover:text-[#111113] cursor-pointer list-none py-1">
          <span className="flex items-center gap-1.5 font-semibold text-[#111113]">
            <Info className="w-3.5 h-3.5 text-[#0071e3]" />
            Resolution Rules & Details
          </span>
          <ChevronDown className="w-4 h-4 text-[#86868b] transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-2 text-[#6e6e73] leading-relaxed bg-[#fbfbfd] p-3 rounded-xl border border-[#f2f2f7] space-y-2">
          {market.description ? (
            <p className="whitespace-pre-line">{market.description}</p>
          ) : (
            <p className="italic text-[#86868b]">
              Resolves according to Polymarket market resolution guidelines.
            </p>
          )}

          {eventSlug && (
            <div className="pt-2 border-t border-[#f2f2f7] flex justify-end">
              <a
                href={`https://polymarket.com/event/${eventSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-[#0071e3] hover:underline font-medium"
              >
                <span>View on Polymarket</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
