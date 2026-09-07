import PolymarketWidget from '@/components/widget/PolymarketWidget';
import { LogoIcon } from '@/components/ui/Logo';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfd]">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#ffffff]/90 backdrop-blur-md border-b border-[#e5e5ea] px-6 lg:px-8 py-3.5 flex items-center justify-between">
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

        {/* Right Controls: Balance & Mode */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-[#f2f2f7] border border-[#e5e5ea] px-3.5 py-1.5 rounded-full text-xs">
            <span className="text-[#86868b] font-medium hidden md:inline">Virtual Balance:</span>
            <span className="font-mono font-semibold text-[#111113] tracking-tight">$1,000.00 USDC</span>
          </div>
          <div className="bg-[#f5f5f7] border border-[#e5e5ea] text-[#6e6e73] font-medium text-xs px-3 py-1.5 rounded-full">
            Paper Trading
          </div>
        </div>
      </header>

      {/* Main Content Area: 2-Column Desktop Grid (Max 1440px) */}
      <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 flex-1">
        <PolymarketWidget />
      </main>

      {/* Clean Minimal Footer */}
      <footer className="mt-auto border-t border-[#e5e5ea] bg-white py-4 px-6 lg:px-8 text-center text-xs text-[#86868b]">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Polymarket AI Committee Predictor • Paper Trading Sandbox</span>
          <span className="font-mono text-[11px] text-[#a1a1a6]">Next.js • TailwindCSS • Real-time Feeds</span>
        </div>
      </footer>
    </div>
  );
}
