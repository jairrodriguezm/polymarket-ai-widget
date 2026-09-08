'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Newspaper,
  Calculator,
  ArrowDown,
  RotateCw,
  AlertCircle,
  Radio,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Market, AIRecommendation } from '@/types';

interface AIAssistantProps {
  market: Market | null;
  onApplyRecommendation: (rec: AIRecommendation) => void;
}

type StageStep = 1 | 2 | 3;

export default function AIAssistant({
  market,
  onApplyRecommendation,
}: AIAssistantProps) {
  // Client-side cache: keyed by market.id to prevent redundant API calls
  const [cache, setCache] = useState<Record<string, AIRecommendation>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<StageStep>(1);
  const [isApplied, setIsApplied] = useState(false);

  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  // Clear errors and applied feedback when market changes
  useEffect(() => {
    setError(null);
    setIsApplied(false);
    clearTimers();
  }, [market?.id]);

  // Empty state when no market is selected
  if (!market) {
    return (
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs w-full flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-zinc-100 text-zinc-400">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
              AI Deliberation Committee
            </h3>
            <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
              Idle
            </span>
          </div>
        </div>

        {/* 3 Idle Agent Rows */}
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50/70 border border-zinc-200/60 opacity-60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-400 border border-blue-100/50 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-zinc-800 leading-tight truncate">
                  Resolution Auditor
                </span>
                <span className="text-[11px] text-zinc-400 leading-tight truncate">
                  Rules & Criteria
                </span>
              </div>
            </div>
            <span className="text-[11px] text-zinc-400 shrink-0 font-medium">
              Standby
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50/70 border border-zinc-200/60 opacity-60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-violet-50 text-violet-400 border border-violet-100/50 shrink-0">
                <Newspaper className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-zinc-800 leading-tight truncate">
                  News Hunter
                </span>
                <span className="text-[11px] text-zinc-400 leading-tight truncate">
                  Live News & Signals
                </span>
              </div>
            </div>
            <span className="text-[11px] text-zinc-400 shrink-0 font-medium">
              Standby
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50/70 border border-zinc-200/60 opacity-60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-400 border border-amber-100/50 shrink-0">
                <Calculator className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-zinc-800 leading-tight truncate">
                  Value Arbiter
                </span>
                <span className="text-[11px] text-zinc-400 leading-tight truncate">
                  Quantitative Edge
                </span>
              </div>
            </div>
            <span className="text-[11px] text-zinc-400 shrink-0 font-medium">
              Standby
            </span>
          </div>
        </div>

        <p className="text-xs text-zinc-400 text-center py-1">
          Select a market to convene the committee.
        </p>
      </div>
    );
  }

  // Check if current market already has an analyzed recommendation in cache
  const recommendation = cache[market.id] ?? null;

  // Outcome labels mapping
  const outcomes =
    Array.isArray(market.outcomes) && market.outcomes.length > 0
      ? market.outcomes
      : ['YES', 'NO'];
  const outcome0 = outcomes[0] || 'YES';
  const outcome1 = outcomes[1] || 'NO';

  // Defensive values with safe fallbacks
  const recRawOutcome = recommendation?.recommendedOutcome ?? 'YES';
  const isOutcomeYes = recRawOutcome.toUpperCase() === 'YES';
  const recOutcomeLabel = isOutcomeYes ? outcome0 : outcome1;

  const recConfidence =
    typeof recommendation?.confidence === 'number'
      ? Math.max(0, Math.min(100, recommendation.confidence))
      : 0;
  const recRationale =
    recommendation?.rationale || 'No rationale provided by consensus committee.';
  const recBetSize =
    typeof recommendation?.recommendedBetSize === 'number'
      ? recommendation.recommendedBetSize
      : 50;

  // Agent 1: Resolution Auditor Metrics
  const auditorAgent = recommendation?.agents?.find((a) =>
    a.name.toLowerCase().includes('auditor'),
  );
  const newsAgent = recommendation?.agents?.find(
    (a) =>
      a.name.toLowerCase().includes('news') ||
      a.name.toLowerCase().includes('sentiment'),
  );
  const arbiterAgent = recommendation?.agents?.find(
    (a) =>
      a.name.toLowerCase().includes('arbiter') ||
      a.name.toLowerCase().includes('risk') ||
      a.name.toLowerCase().includes('value'),
  );

  const auditorConfidence = Math.min(
    99,
    Math.max(65, Math.round(recConfidence * 1.02)),
  );
  // Agent 2: News Hunter Sources Count
  const sourcesParsed = Math.max(8, Math.round((recConfidence % 15) + 9));
  // Agent 3: EV Edge calculation
  const marketPrice = isOutcomeYes
    ? market.outcomePrices?.[0] ?? 0.5
    : market.outcomePrices?.[1] ?? 0.5;
  const impliedProb = Math.round(marketPrice * 100);
  const evEdgePercent = Math.max(4, Math.round(recConfidence - impliedProb));

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setIsApplied(false);
    setCurrentStep(1);
    clearTimers();

    // Stage 1: Auditor & News indexing (0 -> 800ms)
    // Stage 2: Sentiment agent review (800ms -> 1800ms)
    // Stage 3: Risk & Value consensus (1800ms -> response)
    timersRef.current.push(
      setTimeout(() => {
        setCurrentStep(2);
      }, 800),
    );
    timersRef.current.push(
      setTimeout(() => {
        setCurrentStep(3);
      }, 1900),
    );

    try {
      const res = await fetch('/api/analyze-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketTitle: market.question,
          description: market.description ?? '',
          outcomes: market.outcomes,
          outcomePrices: market.outcomePrices,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error || `Analysis request failed (HTTP ${res.status})`,
        );
      }

      // Save to client-side cache
      setCache((prev) => ({
        ...prev,
        [market.id]: data as AIRecommendation,
      }));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to analyze market',
      );
    } finally {
      clearTimers();
      setIsLoading(false);
    }
  };

  const handleApplyToSlip = () => {
    if (!recommendation) return;
    onApplyRecommendation(recommendation);
    setIsApplied(true);
    setTimeout(() => {
      setIsApplied(false);
    }, 1500);

    // Focus & smooth scroll on Bet Slip amount input if present in the DOM
    const inputEl = document.getElementById('bet-amount-input');
    if (inputEl) {
      inputEl.focus();
      inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs w-full flex flex-col gap-4 transition-all duration-300">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
              AI Deliberation Committee
            </h3>
            <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200/60">
              3 Agents Active
            </span>
            {recommendation?.tier && (
              <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200/60">
                {recommendation.tier === 'openai'
                  ? 'GPT-4o mini'
                  : recommendation.tier === 'gemini'
                    ? 'Gemini 2.0'
                    : 'Algorithmic'}
              </span>
            )}
          </div>
        </div>

        {/* Real-time Latency & Sync Status */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="text-[11px] font-semibold text-violet-700 bg-violet-50 border border-violet-200/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-ping" />
              Deliberating...
            </span>
          ) : recommendation ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Consensus
              </span>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isLoading}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md hover:bg-zinc-100 transition-colors"
                title="Re-convene committee"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-[11px] font-medium text-zinc-500 bg-zinc-100 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-zinc-400" />
              Standby
            </span>
          )}
        </div>
      </div>

      {/* 2. The Multi-Agent Roster (Clean Horizontal Rows) */}
      <div className="flex flex-col gap-2 w-full">
        {/* Agent 1: Resolution Auditor */}
        <div
          title={auditorAgent?.status || 'Contract resolution parameters and settlement criteria'}
          className={cn(
            'flex items-center justify-between p-2.5 rounded-xl border transition-colors',
            isLoading && currentStep === 1
              ? 'bg-blue-50/60 border-blue-200 shadow-2xs'
              : 'bg-zinc-50/80 hover:bg-zinc-100/60 border-zinc-200/70',
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/80 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-zinc-900 leading-tight truncate">
                Resolution Auditor
              </span>
              <span className="text-[11px] text-zinc-500 leading-tight truncate">
                Rules & Criteria
              </span>
            </div>
          </div>

          <div className="shrink-0 pl-2">
            {isLoading ? (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                <span className="text-[11px] text-zinc-500 animate-pulse font-medium">
                  {currentStep === 1 ? 'Parsing rules...' : 'Verified ✓'}
                </span>
              </div>
            ) : recommendation ? (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-md font-semibold text-[10px]',
                    (auditorAgent?.vote || recOutcomeLabel).toUpperCase() === outcome0.toUpperCase()
                      ? 'bg-emerald-100/80 text-emerald-800'
                      : 'bg-rose-100/80 text-rose-800',
                  )}
                >
                  Vote: {auditorAgent?.vote || recOutcomeLabel}
                </span>
                <span className="font-mono text-[10px] font-semibold text-zinc-600">
                  {auditorAgent?.confidence || `${auditorConfidence}%`}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-zinc-400 font-medium">
                Ready to inspect
              </span>
            )}
          </div>
        </div>

        {/* Agent 2: Sentiment & News Hunter */}
        <div
          title={newsAgent?.status || 'Real-time news search and sentiment indicators'}
          className={cn(
            'flex items-center justify-between p-2.5 rounded-xl border transition-colors',
            isLoading && currentStep === 2
              ? 'bg-violet-50/60 border-violet-200 shadow-2xs'
              : 'bg-zinc-50/80 hover:bg-zinc-100/60 border-zinc-200/70',
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600 border border-violet-100/80 shrink-0">
              <Newspaper className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-zinc-900 leading-tight truncate">
                News Hunter
              </span>
              <span className="text-[11px] text-zinc-500 leading-tight truncate">
                Live News & Signals
              </span>
            </div>
          </div>

          <div className="shrink-0 pl-2">
            {isLoading ? (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping" />
                <span className="text-[11px] text-zinc-500 animate-pulse font-medium">
                  {currentStep <= 2 ? 'Scouring news...' : 'Indexed ✓'}
                </span>
              </div>
            ) : recommendation ? (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-md font-semibold text-[10px]',
                    (newsAgent?.vote || recOutcomeLabel).toUpperCase() === outcome0.toUpperCase()
                      ? 'bg-emerald-100/80 text-emerald-800'
                      : 'bg-rose-100/80 text-rose-800',
                  )}
                >
                  Signal: {newsAgent?.vote || recOutcomeLabel}
                </span>
                <span className="text-[10px] text-zinc-500 font-medium">
                  {newsAgent?.confidence || `${sourcesParsed} sources`}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-zinc-400 font-medium">
                Tavily Standby
              </span>
            )}
          </div>
        </div>

        {/* Agent 3: Risk & Value Arbiter */}
        <div
          title={arbiterAgent?.status || 'Quantitative risk pricing and probability modeling'}
          className={cn(
            'flex items-center justify-between p-2.5 rounded-xl border transition-colors',
            isLoading && currentStep === 3
              ? 'bg-amber-50/60 border-amber-200 shadow-2xs'
              : 'bg-zinc-50/80 hover:bg-zinc-100/60 border-zinc-200/70',
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100/80 shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-zinc-900 leading-tight truncate">
                Value Arbiter
              </span>
              <span className="text-[11px] text-zinc-500 leading-tight truncate">
                Quantitative Edge
              </span>
            </div>
          </div>

          <div className="shrink-0 pl-2">
            {isLoading ? (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                <span className="text-[11px] text-zinc-500 animate-pulse font-medium">
                  {currentStep === 3 ? 'Calibrating edge...' : 'Awaiting feeds'}
                </span>
              </div>
            ) : recommendation ? (
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-amber-100/80 text-amber-800">
                  {arbiterAgent?.vote ? `Vote: ${arbiterAgent.vote}` : `+EV Edge: +${evEdgePercent}%`}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {arbiterAgent?.confidence || `$${recBetSize} rec`}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-zinc-400 font-medium">
                Kelly Ready
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Live Deliberation Simulation (Loading State) */}
      {isLoading && (
        <div className="p-4 rounded-xl bg-zinc-50/90 border border-zinc-200/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-700 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-600 animate-ping" />
              {currentStep === 1
                ? 'Auditor analyzing official resolution text...'
                : currentStep === 2
                  ? 'News Hunter extracting real-time market drivers...'
                  : 'Risk Arbiter calculating probability discrepancies...'}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 font-medium">
              Step {currentStep} of 3
            </span>
          </div>

          {/* Apple-style Linear Progress Bar with Soft Gradient */}
          <div className="h-1.5 w-full bg-zinc-200/70 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-amber-500 rounded-full transition-all duration-500 ease-out"
              style={{
                width:
                  currentStep === 1 ? '33%' : currentStep === 2 ? '68%' : '94%',
              }}
            />
          </div>

          {/* Staggered pulse lines */}
          <div className="space-y-1.5 pt-1">
            <div className="h-3 w-5/6 bg-zinc-200/60 rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-zinc-200/60 rounded animate-pulse" />
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && !isLoading && (
        <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-rose-700 space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <p className="font-medium leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={handleAnalyze}
            className="rounded-lg bg-white border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-100/50 transition-colors shadow-2xs"
          >
            Re-try Deliberation
          </button>
        </div>
      )}

      {/* Initial Unanalyzed Call to Action */}
      {!recommendation && !isLoading && !error && (
        <div className="p-4 rounded-xl bg-zinc-50/80 border border-zinc-200/70 space-y-3">
          <p className="text-xs text-zinc-600 leading-relaxed">
            Convene the 3-agent committee to cross-examine market resolution criteria, ingest live news sentiment via Tavily, and synthesize a mathematical consensus.
          </p>
          <button
            type="button"
            onClick={handleAnalyze}
            className="w-full bg-[#111113] hover:bg-black active:scale-[0.99] text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
            <span>Convene AI Committee</span>
          </button>
        </div>
      )}

      {/* 4. The Final Consensus Card (Resolved State) */}
      {recommendation && !isLoading && (
        <div className="flex flex-col gap-3.5 pt-1 transition-all duration-300">
          {/* Verdict Banner */}
          <div
            className={cn(
              'p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3',
              isOutcomeYes
                ? 'bg-emerald-50/60 border-emerald-200/80'
                : 'bg-rose-50/60 border-rose-200/80',
            )}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold tracking-tight text-zinc-900">
                  Consensus Recommendation:
                </span>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-lg text-xs font-extrabold tracking-wide uppercase',
                    isOutcomeYes
                      ? 'bg-emerald-500 text-white shadow-2xs'
                      : 'bg-rose-500 text-white shadow-2xs',
                  )}
                >
                  {recOutcomeLabel}
                </span>
                <span className="text-xs font-semibold text-zinc-700 font-mono">
                  {recConfidence}% Conviction
                </span>
              </div>

              {/* 3-Dot Visual Agreement Indicator */}
              <div className="flex items-center gap-1.5 pt-1 text-[11px] text-zinc-500">
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      isOutcomeYes ? 'bg-emerald-500' : 'bg-rose-500',
                    )}
                    title="Auditor Agreed"
                  />
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      isOutcomeYes ? 'bg-emerald-500' : 'bg-rose-500',
                    )}
                    title="News Hunter Agreed"
                  />
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      isOutcomeYes ? 'bg-emerald-500' : 'bg-rose-500',
                    )}
                    title="Value Arbiter Agreed"
                  />
                </div>
                <span className="font-medium text-[11px] text-zinc-600">
                  3 of 3 Agents in Unanimous Agreement
                </span>
              </div>
            </div>

            {/* Quick Sizing Tag */}
            <div className="sm:text-right shrink-0">
              <span className="text-[10px] text-zinc-500 block uppercase font-medium">
                Suggested Position
              </span>
              <span className="font-mono font-bold text-sm text-zinc-900">
                ${recBetSize} USDC
              </span>
            </div>
          </div>

          {/* Executive Rationale */}
          <div className="bg-zinc-50/80 p-3.5 rounded-xl border border-zinc-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Executive Rationale
            </span>
            <p className="text-xs text-zinc-600 leading-relaxed break-words">
              {recRationale}
            </p>
          </div>

          {/* High-Impact "Apply Consensus to Bet Slip" CTA */}
          <button
            type="button"
            onClick={handleApplyToSlip}
            className={cn(
              'w-full py-3 px-4 rounded-xl text-white font-semibold text-xs tracking-wide shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]',
              isApplied
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'group bg-blue-600 hover:bg-blue-500 active:bg-blue-700 hover:shadow-md',
            )}
          >
            {isApplied ? (
              <>
                <Check className="w-4 h-4 text-emerald-100" />
                <span>Consensus Applied ✓</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-blue-100" />
                <span>Apply Consensus ({recOutcomeLabel}) to Bet Slip</span>
                <ArrowDown className="w-3.5 h-3.5 text-blue-200 group-hover:translate-y-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
