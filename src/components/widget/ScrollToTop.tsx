'use client';

import { useState, useEffect, useCallback, RefObject } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ScrollToTopProps {
  containerRef?: RefObject<HTMLElement | null>;
  isMobileDrawerOpen?: boolean;
}

export default function ScrollToTop({
  containerRef,
  isMobileDrawerOpen = false,
}: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [leftCoord, setLeftCoord] = useState<number | null>(null);

  // Measure and align to horizontal center of the target container (left column)
  const updatePosition = useCallback(() => {
    if (containerRef?.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setLeftCoord(rect.left + rect.width / 2);
    } else {
      setLeftCoord(null);
    }
  }, [containerRef]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition, { passive: true });
    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, [updatePosition]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(scrollY > 400);
      updatePosition();
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [updatePosition]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // If mobile drawer is open on mobile viewport, hide the floating button
  if (isMobileDrawerOpen) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      style={{
        left: leftCoord !== null ? `${leftCoord}px` : '50%',
      }}
      className={cn(
        'fixed bottom-6 lg:bottom-8 z-30 -translate-x-1/2',
        'group flex items-center gap-1.5 px-3.5 py-2 rounded-full',
        'bg-white/90 hover:bg-white backdrop-blur-md',
        'border border-zinc-200/90 shadow-md hover:shadow-lg',
        'text-zinc-700 hover:text-zinc-950 text-xs font-medium',
        'transition-all duration-200 cursor-pointer active:scale-95 select-none',
        isVisible
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-95 translate-y-3 pointer-events-none',
      )}
    >
      <ArrowUp className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-900 transition-colors" />
      <span className="hidden sm:inline">Back to top</span>
      <span className="sm:hidden text-[11px]">Top</span>
    </button>
  );
}
