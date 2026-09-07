'use client';

import { useState, useRef, useEffect } from 'react';
import { BarChart3, Clock, Sparkles, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { SortOption } from '@/types';

export interface SortOptionConfig {
  id: SortOption;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string | null;
}

export const SORT_OPTIONS: readonly SortOptionConfig[] = [
  { id: 'volume', label: 'Highest Volume', icon: BarChart3, badge: 'Popular' },
  { id: 'ending_soon', label: 'Ending Soon', icon: Clock, badge: null },
  { id: 'newest', label: 'Newest Markets', icon: Sparkles, badge: 'New' },
] as const;

interface SortDropdownProps {
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export default function SortDropdown({
  activeSort,
  onSortChange,
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption =
    SORT_OPTIONS.find((opt) => opt.id === activeSort) || SORT_OPTIONS[0];
  const ActiveIcon = currentOption.icon;

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle Escape key to close dropdown
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectOption = (optionId: SortOption) => {
    onSortChange(optionId);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={cn(
          'relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-50',
          'border border-zinc-200/80 shadow-xs text-xs font-medium text-zinc-700',
          'transition-all duration-150 cursor-pointer select-none active:scale-[0.98]',
          isOpen && 'border-zinc-300 ring-2 ring-zinc-100',
        )}
      >
        <ActiveIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        <span className="flex items-center gap-1">
          <span className="text-zinc-500 font-normal">Sort:</span>
          <span className="text-zinc-900 font-semibold">{currentOption.label}</span>
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {/* Floating Popover Menu Panel */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={cn(
            'absolute right-0 top-full mt-1.5 w-52 z-40',
            'bg-white/95 backdrop-blur-md border border-zinc-200/80 rounded-2xl p-1.5',
            'shadow-xl shadow-zinc-900/5 ring-1 ring-black/5',
            'animate-in fade-in zoom-in-95 duration-150',
          )}
        >
          <div className="space-y-0.5">
            {SORT_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = option.id === activeSort;

              return (
                <button
                  key={option.id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelectOption(option.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left',
                    isSelected
                      ? 'bg-zinc-100/90 text-zinc-950 font-medium'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70',
                  )}
                >
                  {/* Left: Icon + Label */}
                  <div className="flex items-center min-w-0 pr-2">
                    <Icon className="w-3.5 h-3.5 mr-2 text-zinc-400 shrink-0" />
                    <span className="truncate">{option.label}</span>
                  </div>

                  {/* Right: Check icon or badge */}
                  <div className="flex items-center shrink-0">
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                    ) : option.badge ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-500">
                        {option.badge}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}