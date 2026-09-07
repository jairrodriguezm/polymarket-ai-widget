'use client';

import { Receipt } from 'lucide-react';
import { LogoIcon } from '@/components/ui/Logo';
import { usePortfolio } from '@/context/PortfolioContext';

export default function Navbar() {
  const { virtualBalance, bets, openMyBetsModal } = usePortfolio();

  return (
    <header className="sticky top-0 z-40 bg-[#ffffff]/90 backdrop-blur-md border-b border-[#e5e5ea] px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Brand / Title & Status */}
      <div className="flex items-center gap-3.5">
        {/* Option C: Oracle Spark & Polyline Brand Mark */}
        <div className="w-8 h-8 rounded-xl bg-[#f5f5f7] border border-[#e5e5ea] flex items-center justify-center p-1 shadow-2xs">
          <LogoIcon size={26} variant="color" />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-[15px] tracking-tight text-[#1d1d1f]">
            POLYMARKET
          </span>
          <span className="bg-[#0071e3] text-white text-[9px] font-bold px-1.5 py-0.5 rounded leading-none shadow-2xs">
            AI
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f2f2f7] text-[#86868b] border border-[#e5e5ea] hidden sm:inline-block">
            Predictor
          </span>
        </div>

        <div className="h-4 w-[1px] bg-[#e5e5ea] mx-1 hidden sm:block" />
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#34c759]/10 text-[#28a745] text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34c759] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34c759]" />
          </span>
          <span>Live Feed</span>
        </div>
      </div>

      {/* Right Controls: Balance, My Bets & Mode */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Interactive Virtual Balance Chip */}
        <button
          type="button"
          onClick={openMyBetsModal}
          className="flex items-center gap-1.5 sm:gap-2 bg-[#f2f2f7] hover:bg-[#e5e5ea] border border-[#e5e5ea] px-3 sm:px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer active:scale-95"
          title="Click to view portfolio"
        >
          <span className="text-[#86868b] font-medium hidden md:inline">
            Virtual Balance:
          </span>
          <span className="font-mono font-semibold text-[#111113] tracking-tight">
            ${virtualBalance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            USDC
          </span>
        </button>

        {/* Dedicated "My Bets" Pill Button */}
        <button
          type="button"
          onClick={openMyBetsModal}
          className="hover:bg-zinc-100 bg-white border border-zinc-200/80 rounded-full px-3 py-1.5 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-950 active:scale-95 shadow-2xs"
          title="View active bets"
        >
          <Receipt className="w-3.5 h-3.5 text-zinc-500" />
          <span className="hidden xs:inline">My Bets</span>
          {bets.length > 0 && (
            <span className="bg-[#0071e3] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-tight">
              {bets.length}
            </span>
          )}
        </button>

        {/* Mode Pill */}
        <div className="bg-[#f5f5f7] border border-[#e5e5ea] text-[#6e6e73] font-medium text-xs px-3 py-1.5 rounded-full hidden md:inline-block">
          Paper Trading
        </div>
      </div>
    </header>
  );
}
