'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { supabase } from '@/lib/supabase';
import type { Market, AIRecommendation, Bet } from '@/types';

const INITIAL_BALANCE = parseFloat(
  process.env.NEXT_PUBLIC_INITIAL_BALANCE ?? '1000',
);
const DEMO_PROFILE_ID = '00000000-0000-0000-0000-000000000001';

interface BetSlipProps {
  market: Market;
  appliedRecommendation: AIRecommendation | null;
  onBetPlaced?: () => void;
}

/**
 * Defensively fetches the demo profile without throwing PGRST116 when empty,
 * automatically seeding the default demo profile on the fly if needed.
 */
async function fetchOrCreateDemoProfile(): Promise<{
  id: string;
  virtual_balance: number;
}> {
  try {
    const { data: profiles, error: fetchErr } = await supabase
      .from('profiles')
      .select('id, virtual_balance')
      .limit(1);

    if (fetchErr) {
      console.warn('[BetSlip] Profile fetch notice:', fetchErr.message);
    }

    let currentProfile = profiles?.[0];

    // If no profile exists, auto-create the default demo profile on the fly
    if (!currentProfile) {
      const { data: newProfile, error: insertErr } = await supabase
        .from('profiles')
        .insert({
          id: DEMO_PROFILE_ID,
          username: 'Demo Trader',
          virtual_balance: INITIAL_BALANCE,
        })
        .select('id, virtual_balance')
        .single();

      if (insertErr) {
        console.warn(
          '[BetSlip] Profile auto-creation fallback:',
          insertErr.message,
        );
        return { id: DEMO_PROFILE_ID, virtual_balance: INITIAL_BALANCE };
      }

      if (newProfile) {
        currentProfile = newProfile;
      }
    }

    return (
      currentProfile ?? {
        id: DEMO_PROFILE_ID,
        virtual_balance: INITIAL_BALANCE,
      }
    );
  } catch (err) {
    console.warn('[BetSlip] Profile resolution fallback:', err);
    return { id: DEMO_PROFILE_ID, virtual_balance: INITIAL_BALANCE };
  }
}

export default function BetSlip({
  market,
  appliedRecommendation,
  onBetPlaced,
}: BetSlipProps) {
  const outcomes =
    Array.isArray(market.outcomes) && market.outcomes.length > 0
      ? market.outcomes
      : ['YES', 'NO'];
  const outcome0 = outcomes[0] || 'YES';
  const outcome1 = outcomes[1] || 'NO';

  const [outcome, setOutcome] = useState<string>(() => {
    if (appliedRecommendation?.recommendedOutcome) {
      const rec = appliedRecommendation.recommendedOutcome.toLowerCase();
      const match = outcomes.find((o) => o.toLowerCase() === rec);
      if (match) return match;
      if (rec === 'yes') return outcome0;
      if (rec === 'no') return outcome1;
    }
    return outcome0;
  });
  const [amount, setAmount] = useState<string>(
    appliedRecommendation?.recommendedBetSize?.toString() ?? '50',
  );
  const [profile, setProfile] = useState<{
    id: string;
    virtual_balance: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch or create demo profile on mount
  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      try {
        const prof = await fetchOrCreateDemoProfile();
        if (isMounted) {
          setProfile(prof);
        }
      } catch (err) {
        console.error('[BetSlip] Failed to load profile:', err);
      }
    }
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync state when recommendation is applied externally or market changes
  useEffect(() => {
    if (appliedRecommendation?.recommendedOutcome) {
      const rec = appliedRecommendation.recommendedOutcome.toLowerCase();
      const match = outcomes.find((o) => o.toLowerCase() === rec);
      if (match) {
        setOutcome(match);
      } else if (rec === 'yes') {
        setOutcome(outcome0);
      } else if (rec === 'no') {
        setOutcome(outcome1);
      }
      setAmount(appliedRecommendation.recommendedBetSize.toString());
    } else {
      if (!outcomes.includes(outcome)) {
        setOutcome(outcome0);
      }
    }
  }, [appliedRecommendation, market.id, outcome0, outcome1]);

  const parsedAmount = parseFloat(amount) || 0;
  const outcomeIndex = Math.max(0, outcomes.indexOf(outcome));
  const selectedOutcomeLabel = outcomes[outcomeIndex] || outcome0;

  const price = market.outcomePrices[outcomeIndex] ?? 0.5;
  const shares = price > 0 ? parsedAmount / price : 0;
  const potentialPayout = shares; // Each winning share pays $1 USDC
  const potentialProfit = potentialPayout - parsedAmount;
  const profitPercentage = parsedAmount > 0 ? (potentialProfit / parsedAmount) * 100 : 0;

  const currentBalance = profile?.virtual_balance ?? INITIAL_BALANCE;

  const price0 = market.outcomePrices?.[0] ?? 0.5;
  const price1 = market.outcomePrices?.[1] ?? (1 - price0);
  const cents0 = (price0 * 100).toFixed(0);
  const cents1 = (price1 * 100).toFixed(0);

  // Preset increment handlers
  const handleAddAmount = (addVal: number) => {
    const cur = parseFloat(amount) || 0;
    const next = Math.min(cur + addVal, currentBalance);
    setAmount(next.toFixed(0));
  };

  const handleMaxAmount = () => {
    setAmount(currentBalance.toFixed(0));
  };

  const handlePlaceBet = async () => {
    if (parsedAmount <= 0) {
      setError('Enter a valid bet amount (must be greater than $0).');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const activeProfile = await fetchOrCreateDemoProfile();
      setProfile(activeProfile);

      const profileId = activeProfile.id;
      const liveBal = activeProfile.virtual_balance ?? INITIAL_BALANCE;

      if (parsedAmount > liveBal) {
        throw new Error(
          `Insufficient virtual balance. Available: $${liveBal.toFixed(2)} USDC, Attempted: $${parsedAmount.toFixed(2)} USDC.`,
        );
      }

      // 2. Insert bet using dynamic profileId (valid UUID)
      const bet: Bet = {
        profile_id: profileId,
        market_id: market.id,
        market_question: market.question,
        outcome: selectedOutcomeLabel,
        shares: parseFloat(shares.toFixed(4)),
        price_per_share: parseFloat(price.toFixed(4)),
        total_invested: parsedAmount,
        potential_payout: parseFloat(potentialPayout.toFixed(2)),
        ai_assisted: appliedRecommendation !== null,
        ai_confidence: appliedRecommendation?.confidence ?? null,
        status: 'OPEN',
      };

      const { error: insertError } = await supabase
        .from('bets')
        .insert([bet]);

      if (insertError) {
        throw new Error(insertError.message);
      }

      // 3. Decrement user's virtual_balance in profiles by total_invested
      const updatedBalance = liveBal - parsedAmount;
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ virtual_balance: updatedBalance })
        .eq('id', profileId);

      if (balanceError) {
        console.error('[BetSlip] Balance update failed:', balanceError.message);
      } else {
        setProfile({ id: profileId, virtual_balance: updatedBalance });
      }

      setSuccess(true);
      onBetPlaced?.();

      // Auto-dismiss success after 4 seconds
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to place bet',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const eventSlug = market.eventSlug || market.slug || '';
  const childMarketSlug =
    market.marketSlug && market.marketSlug !== eventSlug ? market.marketSlug : '';

  // Extract specific token ID according to the selected outcome index
  const selectedTid = market.clobTokenIds?.[outcomeIndex];

  // Build final deep-link URL preselecting outcome on Polymarket order interface
  let polymarketUrl = '';
  if (eventSlug) {
    const slugPath = childMarketSlug ? `${eventSlug}/${childMarketSlug}` : eventSlug;
    const params = new URLSearchParams();
    if (selectedTid) {
      params.set('tid', selectedTid);
    }
    params.set('side', 'buy');
    params.set('outcome', selectedOutcomeLabel);
    polymarketUrl = `https://polymarket.com/event/${slugPath}?${params.toString()}`;
  } else if (market.slug) {
    const params = new URLSearchParams();
    if (selectedTid) {
      params.set('tid', selectedTid);
    }
    params.set('side', 'buy');
    params.set('outcome', selectedOutcomeLabel);
    polymarketUrl = `https://polymarket.com/event/${market.slug}?${params.toString()}`;
  } else {
    polymarketUrl = `https://polymarket.com/markets?search=${encodeURIComponent(market.question)}`;
  }

  return (
    <div className="bg-white border border-[#e5e5ea] squircle p-5 apple-shadow space-y-4">
      {/* Header & Reset */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#111113] tracking-tight">
          Paper Trading Bet Slip
        </h3>
        <span className="text-[11px] text-[#86868b] font-medium bg-[#f2f2f7] px-2 py-0.5 rounded-full">
          Virtual Sandbox
        </span>
      </div>

      {/* Segmented Outcome Selector */}
      <div className="grid grid-cols-2 p-1 bg-[#f2f2f7] rounded-xl gap-1.5">
        <button
          type="button"
          onClick={() => setOutcome(outcome0)}
          className={cn(
            'py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 truncate',
            outcomeIndex === 0
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-700 shadow-xs font-semibold ring-1 ring-emerald-200/50'
              : 'bg-zinc-100/70 border border-zinc-200/60 text-zinc-600 hover:bg-zinc-100 font-medium',
          )}
        >
          <span className="truncate">BUY {outcome0.toUpperCase()}</span>
          <span>•</span>
          <span className="font-mono shrink-0">{cents0}¢</span>
        </button>
        <button
          type="button"
          onClick={() => setOutcome(outcome1)}
          className={cn(
            'py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 truncate',
            outcomeIndex === 1
              ? 'bg-rose-50 border border-rose-300 text-rose-700 shadow-xs font-semibold ring-1 ring-rose-200/50'
              : 'bg-zinc-100/70 border border-zinc-200/60 text-zinc-600 hover:bg-zinc-100 font-medium',
          )}
        >
          <span className="truncate">BUY {outcome1.toUpperCase()}</span>
          <span>•</span>
          <span className="font-mono shrink-0">{cents1}¢</span>
        </button>
      </div>

      {/* Amount Input ($ USDC) */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-[#86868b] font-medium">
          <span>Order Amount</span>
          <span>
            Available: <strong className="text-[#111113] font-mono">${currentBalance.toFixed(2)}</strong>
          </span>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <span className="text-[#86868b] font-mono font-medium text-sm">$</span>
          </div>
          <input
            id="bet-amount-input"
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-[#fbfbfd] border border-[#e5e5ea] focus:border-[#0071e3] rounded-xl pl-8 pr-16 py-2.5 text-base font-mono font-bold text-[#111113] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-xs font-semibold text-[#86868b] bg-[#f2f2f7] px-2 py-0.5 rounded">
              USDC
            </span>
          </div>
        </div>

        {/* Preset Increment Tags */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => handleAddAmount(10)}
            className="py-1 rounded-lg bg-[#f2f2f7] hover:bg-[#e5e5ea] text-xs font-semibold text-[#515154] transition-colors"
          >
            +$10
          </button>
          <button
            type="button"
            onClick={() => handleAddAmount(50)}
            className="py-1 rounded-lg bg-[#f2f2f7] hover:bg-[#e5e5ea] text-xs font-semibold text-[#515154] transition-colors"
          >
            +$50
          </button>
          <button
            type="button"
            onClick={() => handleAddAmount(100)}
            className="py-1 rounded-lg bg-[#f2f2f7] hover:bg-[#e5e5ea] text-xs font-semibold text-[#515154] transition-colors"
          >
            +$100
          </button>
          <button
            type="button"
            onClick={handleMaxAmount}
            className="py-1 rounded-lg bg-[#f2f2f7] hover:bg-[#e5e5ea] text-xs font-semibold text-[#515154] transition-colors"
          >
            Max
          </button>
        </div>
      </div>

      {/* Breakdown Row (Monospace) */}
      <div className="bg-[#fbfbfd] border border-[#f2f2f7] rounded-xl p-3 space-y-1.5 text-xs">
        <div className="flex justify-between items-center text-[#6e6e73]">
          <span>Contracts / Shares</span>
          <span className="font-mono font-medium text-[#111113]">
            {shares > 0 ? (
              <>
                {shares.toFixed(2)}{' '}
                <span
                  className={cn(
                    'text-[11px] font-semibold px-1.5 py-0.5 rounded border',
                    outcome === 'YES'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
                  )}
                >
                  {outcome}
                </span>
              </>
            ) : (
              '0.00'
            )}
          </span>
        </div>
        <div className="flex justify-between items-center text-[#6e6e73]">
          <span>Average Price</span>
          <span className="font-mono font-medium text-[#111113]">
            {price.toFixed(3)} USDC
          </span>
        </div>
        <div className="flex justify-between items-center text-[#6e6e73]">
          <span>Estimated Fee</span>
          <span className="font-mono font-medium text-[#28a745]">$0.00 (Free)</span>
        </div>
        <div className="h-[1px] bg-[#e5e5ea] my-1" />
        <div className="flex justify-between items-center text-[#111113] pt-0.5">
          <span className="font-semibold">Potential Return</span>
          <span className="font-mono font-bold text-sm text-[#28a745]">
            ${potentialPayout.toFixed(2)} (+{profitPercentage.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* AI Recommendation Indicator if applied */}
      {appliedRecommendation && (
        <div className="rounded-lg bg-[#f0f6fe] border border-[#0071e3]/20 px-3 py-2 text-xs text-[#0071e3] font-medium flex items-center justify-between">
          <span>AI Suggested Bet</span>
          <span className="font-mono font-bold">{appliedRecommendation.confidence}% confidence</span>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-100">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-100">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Paper bet placed successfully! Virtual balance updated.</span>
        </div>
      )}

      {/* Primary Action: Solid Apple Blue Button */}
      <button
        type="button"
        onClick={handlePlaceBet}
        disabled={isSubmitting || parsedAmount <= 0}
        className="w-full bg-[#0071e3] hover:bg-[#005bb5] active:scale-[0.99] text-white font-semibold text-sm py-3.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing Paper Bet…</span>
          </>
        ) : (
          <>
            <span>Place Bet on {selectedOutcomeLabel}</span>
            <span className="font-mono text-xs opacity-90">
              ({parsedAmount.toFixed(2)} USDC)
            </span>
          </>
        )}
      </button>

      {/* Secondary Action: Low-Profile Secondary External Button */}
      <div className="space-y-1">
        <a
          href={polymarketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group w-full py-2.5 px-4 rounded-xl bg-zinc-100/80 border border-zinc-200/70 text-zinc-700 text-xs font-medium tracking-tight flex items-center justify-center gap-1.5 transition-all duration-150 hover:bg-zinc-200/70 hover:border-zinc-300 hover:text-zinc-900 active:bg-zinc-200 active:scale-[0.99] antialiased"
        >
          <span>
            Trade{' '}
            <strong
              className={
                outcomeIndex === 0
                  ? 'text-emerald-600 font-semibold'
                  : 'text-rose-600 font-semibold'
              }
            >
              {selectedOutcomeLabel}
            </strong>{' '}
            on Polymarket
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 transition-colors" />
        </a>

        {outcomeIndex !== 0 && (
          <p className="text-[11px] text-zinc-500 text-center mt-1">
            Note: Polymarket defaults to &apos;Buy {outcome0}&apos; on load. Make sure to toggle to &apos;{selectedOutcomeLabel}&apos; in their order book.
          </p>
        )}
      </div>
    </div>
  );
}
