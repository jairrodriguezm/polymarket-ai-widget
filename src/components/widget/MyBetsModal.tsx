'use client';

import { useEffect, useCallback } from 'react';
import { X, Receipt, Clock, TrendingUp, RefreshCw, ExternalLink } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { cn } from '@/lib/cn';
import type { Bet } from '@/types';

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Just now';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function isAffirmativeOutcome(outcome?: string): boolean {
  const norm = (outcome || '').toLowerCase().trim();
  return norm === 'yes' || norm === 'over' || norm === 'true' || norm === '1';
}

export default function MyBetsModal() {
  const {
    isMyBetsModalOpen,
    closeMyBetsModal,
    bets,
    isLoadingBets,
    refreshPortfolio,
    virtualBalance,
  } = usePortfolio();

  // Keyboard Escape listener
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMyBetsModal();
      }
    },
    [closeMyBetsModal],
  );

  // Body scroll lock effect
  useEffect(() => {
    if (isMyBetsModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMyBetsModalOpen, handleKeyDown]);

  if (!isMyBetsModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="portfolio-modal-title"
      className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeMyBetsModal();
        }
      }}
    >
      <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-[#fafafc]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="portfolio-modal-title"
                  className="text-sm font-bold text-zinc-900 tracking-tight"
                >
                  My Portfolio
                </h2>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                  {bets.length} {bets.length === 1 ? 'Position' : 'Positions'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Available Cash: ${virtualBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => refreshPortfolio()}
              disabled={isLoadingBets}
              title="Refresh positions"
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200/80 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isLoadingBets && 'animate-spin')} />
            </button>
            <button
              type="button"
              onClick={closeMyBetsModal}
              aria-label="Close modal"
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto p-5 space-y-3 flex-1 bg-white">
          {isLoadingBets && bets.length === 0 ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/50 space-y-2.5 animate-pulse"
                >
                  <div className="h-4 bg-zinc-200 rounded w-3/4" />
                  <div className="h-3 bg-zinc-200 rounded w-1/3" />
                  <div className="h-6 bg-zinc-200 rounded w-full pt-2" />
                </div>
              ))}
            </div>
          ) : bets.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center border border-zinc-200/60">
                <Receipt className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-zinc-900">
                  No active bets yet
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
                  Explore prediction markets and place your first paper trade with virtual USDC.
                </p>
              </div>
            </div>
          ) : (
            bets.map((bet, index) => {
              const outcome = bet.outcome || 'YES';
              const isAffirmative = isAffirmativeOutcome(outcome);
              const stake = bet.total_invested ?? (bet as any).amount ?? 0;
              const price = bet.price_per_share ?? (bet as any).price ?? 0.5;
              const shares = bet.shares ?? (price > 0 ? stake / price : 0);
              const payout = bet.potential_payout ?? 0;

              return (
                <div
                  key={bet.id || `bet-${index}`}
                  className="p-3.5 rounded-xl border border-zinc-200/80 bg-[#fbfbfd] hover:bg-zinc-50/80 transition-colors space-y-2.5"
                >
                  {/* Top Row: Market Question + Time */}
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-semibold text-xs text-zinc-900 leading-snug line-clamp-2">
                      {bet.market_question}
                    </h4>
                    <span className="text-[10px] text-zinc-400 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(bet.created_at)}
                    </span>
                  </div>

                  {/* Middle Row: Outcome Badge + Contract Shares */}
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-md font-semibold text-[11px] border',
                        isAffirmative
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                          : 'bg-rose-50 text-rose-700 border-rose-200/70',
                      )}
                    >
                      {outcome}
                    </span>
                    <span className="font-mono text-zinc-600 text-xs font-medium">
                      {shares.toFixed(2)} Shares
                    </span>
                    {bet.ai_assisted && (
                      <span className="ml-auto text-[10px] text-violet-600 bg-violet-50 border border-violet-100/80 px-2 py-0.5 rounded-full font-medium">
                        AI Recommended
                      </span>
                    )}
                  </div>

                  {/* Bottom Metrics Grid */}
                  <div className="pt-2 border-t border-zinc-200/60 grid grid-cols-4 gap-2 text-[11px]">
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Stake</span>
                      <span className="font-mono font-medium text-zinc-800">
                        ${stake.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Entry Price</span>
                      <span className="font-mono font-medium text-zinc-800">
                        ${price.toFixed(3)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Est. Payout</span>
                      <span className="font-mono font-bold text-zinc-900">
                        ${payout.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-400 block text-[10px]">Status</span>
                      <span className="inline-block bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
                        {bet.status || 'OPEN'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
