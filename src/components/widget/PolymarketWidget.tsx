'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Sparkles, ArrowLeft, X } from 'lucide-react';
import type { Market, AIRecommendation } from '@/types';
import { LogoIcon } from '@/components/ui/Logo';
import MarketSearch from './MarketSearch';
import MarketDetails from './MarketDetails';
import AIAssistant from './AIAssistant';
import BetSlip from './BetSlip';
import ScrollToTop from './ScrollToTop';

export default function PolymarketWidget() {
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [appliedRecommendation, setAppliedRecommendation] =
    useState<AIRecommendation | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const leftSectionRef = useRef<HTMLElement>(null);

  // Prevent background body scrolling strictly on mobile viewports when the mobile drawer is explicitly open
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        setIsMobileDrawerOpen(false);
        document.body.style.overflow = '';
      }
    };

    // Only lock scroll on mobile viewports (< 1024px) when the mobile drawer is open
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    if (isMobile && isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    window.addEventListener('resize', handleResize);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobileDrawerOpen]);

  const handleSelectMarket = useCallback((market: Market) => {
    setSelectedMarket(market);
    setAppliedRecommendation(null); // Reset recommendation / bet input on new market

    // Strictly open mobile drawer only on mobile viewports (< 1024px)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileDrawerOpen(true);
    }
  }, []);

  const handleApplyRecommendation = useCallback((rec: AIRecommendation) => {
    setAppliedRecommendation(rec);
  }, []);

  const handleBetPlaced = useCallback(() => {
    // Automatically close the mobile drawer upon bet execution after user sees confirmation
    setTimeout(() => {
      setIsMobileDrawerOpen(false);
    }, 1200);
  }, []);

  const handleCloseMobileDrawer = useCallback(() => {
    setIsMobileDrawerOpen(false);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      {/* ── Left Column: Markets Explorer (Full width on mobile, 7 cols on desktop) ── */}
      <section
        ref={leftSectionRef}
        className="w-full lg:col-span-7 space-y-5 min-h-screen relative"
      >
        <MarketSearch
          selectedMarket={selectedMarket}
          onSelectMarket={handleSelectMarket}
        />
        <ScrollToTop
          containerRef={leftSectionRef}
          isMobileDrawerOpen={isMobileDrawerOpen}
        />
      </section>

      {/* ── Right Column: Sticky Execution Panel (Hidden on mobile, 5 cols on desktop) ── */}
      <aside className="hidden lg:flex lg:col-span-5 lg:sticky lg:top-20 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto flex-col gap-4 pr-1.5 scroll-smooth pb-6">
        {selectedMarket ? (
          <>
            {/* Section A: Market Details & Rules Card */}
            <MarketDetails market={selectedMarket} />

            {/* Section B: AI Committee Consensus (Staged Animation & Multi-Agent RAG) */}
            <AIAssistant
              market={selectedMarket}
              onApplyRecommendation={handleApplyRecommendation}
            />

            {/* Section C: Paper Trading Bet Slip Card */}
            <BetSlip
              key={`bet-${selectedMarket.id}`}
              market={selectedMarket}
              appliedRecommendation={appliedRecommendation}
              onBetPlaced={handleBetPlaced}
            />
          </>
        ) : (
          /* Empty Selection Placeholder */
          <div className="bg-white border border-[#e5e5ea] squircle p-8 apple-shadow flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0071e3]/10 flex items-center justify-center text-[#0071e3]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111113]">
                Select a Prediction Market
              </h3>
              <p className="mt-1 text-xs text-[#86868b] max-w-xs leading-relaxed">
                Choose any active market from the explorer to run the AI expert committee consensus and place paper bets.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#0071e3] pt-1">
              <ArrowLeft className="h-3.5 w-3.5 animate-pulse" />
              <span>Choose from the left column</span>
            </div>
          </div>
        )}
      </aside>

      {/* ── Mobile Slide-Over Overlay / Drawer (Below lg breakpoint) ── */}
      {isMobileDrawerOpen && selectedMarket && (
        <div className="fixed inset-0 z-50 overflow-y-auto lg:hidden bg-[#fbfbfd]">
          {/* Sticky Drawer Top Header */}
          <div className="sticky top-0 z-10 bg-[#ffffff]/90 backdrop-blur-md border-b border-[#e5e5ea] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#f5f5f7] border border-[#e5e5ea] flex items-center justify-center p-0.5 shadow-2xs">
                <LogoIcon size={18} variant="color" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-[#111113]">
                Order & Analysis
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f2f2f7] text-[#86868b] border border-[#e5e5ea]">
                Live
              </span>
            </div>
            <button
              type="button"
              onClick={handleCloseMobileDrawer}
              aria-label="Close drawer"
              className="w-8 h-8 rounded-full bg-[#f2f2f7] hover:bg-[#e5e5ea] active:scale-95 flex items-center justify-center text-[#111113] transition-all border border-[#e5e5ea]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body Components Stack */}
          <div className="p-4 space-y-4 max-w-xl mx-auto pb-12">
            <MarketDetails market={selectedMarket} />
            <AIAssistant
              market={selectedMarket}
              onApplyRecommendation={handleApplyRecommendation}
            />
            <BetSlip
              key={`mobile-bet-${selectedMarket.id}`}
              market={selectedMarket}
              appliedRecommendation={appliedRecommendation}
              onBetPlaced={handleBetPlaced}
            />
          </div>
        </div>
      )}
    </div>
  );
}
