'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Flame,
  LayoutGrid,
  Landmark,
  Coins,
  Trophy,
  Sparkles,
  Globe2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';

/** Authentic classic soccer ball icon with central pentagon and radiating seams */
export function SoccerBallIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-3.5 w-3.5 shrink-0', className)}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon
        points="12,7.5 15.8,10.2 14.3,14.8 9.7,14.8 8.2,10.2"
        fill="currentColor"
        fillOpacity="0.25"
      />
      <line x1="12" y1="2" x2="12" y2="7.5" />
      <line x1="21.5" y1="8.9" x2="15.8" y2="10.2" />
      <line x1="17.9" y1="20.1" x2="14.3" y2="14.8" />
      <line x1="6.1" y1="20.1" x2="9.7" y2="14.8" />
      <line x1="2.5" y1="8.9" x2="8.2" y2="10.2" />
    </svg>
  );
}

export type CategoryId =
  | 'all'
  | 'trending'
  | 'politics'
  | 'pop-culture'
  | 'soccer'
  | 'latam'
  | 'crypto'
  | 'sports';

export interface CategoryItem {
  id: CategoryId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CATEGORIES: CategoryItem[] = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'politics', label: 'Politics', icon: Landmark },
  { id: 'pop-culture', label: 'Pop Culture', icon: Sparkles },
  { id: 'soccer', label: 'Soccer', icon: SoccerBallIcon },
  { id: 'latam', label: 'LatAm', icon: Globe2 },
  { id: 'crypto', label: 'Crypto', icon: Coins },
  { id: 'sports', label: 'Sports', icon: Trophy },
];

interface CategoryFiltersProps {
  activeCategory: CategoryId | null;
  onSelectCategory: (categoryId: CategoryId) => void;
}

export default function CategoryFilters({
  activeCategory,
  onSelectCategory,
}: CategoryFiltersProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 20);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 15);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScroll();

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex items-center w-full">
      {/* Left Scroll Button & Fade Mask */}
      {canScrollLeft && (
        <div className="bg-gradient-to-r from-[#fbfbfd] via-[#fbfbfd]/90 to-transparent w-12 h-full absolute left-0 z-10 flex items-center justify-start pointer-events-none">
          <button
            type="button"
            onClick={handleScrollLeft}
            aria-label="Scroll left"
            className="pointer-events-auto p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm border border-zinc-200/80 transition-transform active:scale-95 text-zinc-600 hover:text-zinc-900"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Category Pills Container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto scroll-smooth no-scrollbar flex items-center gap-2 pr-12 text-xs font-medium w-full py-1"
      >
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                isActive
                  ? 'bg-[#111113] text-white font-medium shadow-sm'
                  : 'bg-white text-[#515154] hover:bg-[#f2f2f7] border border-[#e5e5ea]',
              )}
            >
              <Icon
                className={cn(
                  'h-3.5 w-3.5',
                  isActive ? 'text-white' : 'text-[#86868b]',
                )}
              />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Scroll Button & Fade Mask */}
      {canScrollRight && (
        <div className="bg-gradient-to-l from-[#fbfbfd] via-[#fbfbfd]/90 to-transparent w-12 h-full absolute right-0 z-10 flex items-center justify-end pointer-events-none">
          <button
            type="button"
            onClick={handleScrollRight}
            aria-label="Scroll right"
            className="pointer-events-auto p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm border border-zinc-200/80 transition-transform active:scale-95 text-zinc-600 hover:text-zinc-900"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
