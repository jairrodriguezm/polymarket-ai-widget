import PolymarketWidget from '@/components/widget/PolymarketWidget';
import Navbar from '@/components/ui/Navbar';
import MyBetsModal from '@/components/widget/MyBetsModal';
import { PortfolioProvider } from '@/context/PortfolioContext';

export default function Home() {
  return (
    <PortfolioProvider>
      <div className="min-h-screen flex flex-col bg-[#fbfbfd]">
        {/* Dynamic Interactive Navigation Header */}
        <Navbar />

        {/* Main Content Area: 2-Column Desktop Grid (Max 1440px) */}
        <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 flex-1">
          <PolymarketWidget />
        </main>

        {/* My Bets Portfolio Modal */}
        <MyBetsModal />

        {/* Clean Minimal Footer */}
        <footer className="mt-auto border-t border-[#e5e5ea] bg-white py-4 px-6 lg:px-8 text-center text-xs text-[#86868b]">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Polymarket AI Committee Predictor • Paper Trading Sandbox</span>
            <span className="font-mono text-[11px] text-[#a1a1a6]">
              Next.js • TailwindCSS • Real-time Feeds
            </span>
          </div>
        </footer>
      </div>
    </PortfolioProvider>
  );
}
