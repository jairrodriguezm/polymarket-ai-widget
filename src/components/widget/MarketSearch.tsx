'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, AlertCircle, Inbox, X } from 'lucide-react';
import { searchMarkets } from '@/services/polymarket';
import type { Market, SortOption } from '@/types';
import MarketCard from './MarketCard';
import CategoryFilters, { type CategoryId } from './CategoryFilters';
import SortDropdown from './SortDropdown';

interface MarketSearchProps {
  selectedMarket: Market | null;
  onSelectMarket: (market: Market) => void;
}

export default function MarketSearch({
  selectedMarket,
  onSelectMarket,
}: MarketSearchProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>('trending');
  const [activeSort, setActiveSort] = useState<SortOption>('volume');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(false);

  const fetchMarkets = useCallback(
    async (searchQuery: string, category?: CategoryId, sort: SortOption = 'volume') => {
      setIsLoading(true);
      setError(null);
      try {
        const results = await searchMarkets(searchQuery, category, sort);
        setMarkets(results);
      } catch {
        setError('Failed to fetch markets. Please try again.');
        setMarkets([]);
      } finally {
        setIsLoading(false);
        setHasSearched(true);
      }
    },
    [],
  );

  // Initial fetch on mount (default trending category, volume sort)
  useEffect(() => {
    fetchMarkets('', 'trending', 'volume');
    isMounted.current = true;
  }, [fetchMarkets]);

  // Debounced search when user types in search bar
  useEffect(() => {
    if (!isMounted.current) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (query.trim()) {
        fetchMarkets(query, undefined, activeSort);
      } else if (!activeCategory) {
        // If query was cleared via backspace and no category is active, restore trending
        setActiveCategory('trending');
        fetchMarkets('', 'trending', activeSort);
      }
    }, 350);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, activeCategory, activeSort, fetchMarkets]);

  // Typing in search bar: clears/deselects active category pill
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim() && activeCategory !== null) {
      setActiveCategory(null);
    }
  };

  // Clicking a category pill: clears search query, sets active category, and fetches immediately
  const handleSelectCategory = (categoryId: CategoryId) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setQuery('');
    setActiveCategory(categoryId);
    fetchMarkets('', categoryId, activeSort);
  };

  // Changing the sort option: re-fetches current category or query with new sort
  const handleSortChange = (newSort: SortOption) => {
    setActiveSort(newSort);
    if (query.trim()) {
      fetchMarkets(query, undefined, newSort);
    } else {
      fetchMarkets('', activeCategory ?? 'trending', newSort);
    }
  };

  // Clear search input button
  const handleClearSearch = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setQuery('');
    setActiveCategory('trending');
    fetchMarkets('', 'trending', activeSort);
  };

  return (
    <div className="space-y-4">
      {/* 1. Search & Category Filters */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-[#86868b]" />
          </div>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={
              activeCategory
                ? `Search ${activeCategory === 'trending' ? 'high volume' : activeCategory === 'all' ? 'all' : activeCategory} prediction markets, Fed, crypto, sports...`
                : 'Search high volume prediction markets, Fed, crypto, sports...'
            }
            className="w-full bg-[#f2f2f7] border-0 rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#111113] placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:bg-white transition-all shadow-inner"
          />
          {query && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#86868b] hover:bg-[#e5e5ea] hover:text-[#111113] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills Row */}
        <CategoryFilters
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
        />
      </div>

      {/* 2. Markets Counter & Sort Bar */}
      <div className="flex items-center justify-between pt-1 gap-2 flex-wrap relative z-30">
        <span className="text-xs text-[#86868b] font-medium">
          {isLoading
            ? 'Loading active markets...'
            : `Showing ${markets.length} Active Market${markets.length === 1 ? '' : 's'}`}
        </span>

        {/* Custom Apple-style Sort Dropdown */}
        <SortDropdown activeSort={activeSort} onSortChange={handleSortChange} />
      </div>

      {/* 3. Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2.5 py-16 text-xs text-[#86868b] font-medium">
          <Loader2 className="h-4 w-4 animate-spin text-[#0071e3]" />
          <span>Loading verified prediction markets…</span>
        </div>
      )}

      {/* 4. Error State */}
      {error && !isLoading && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs text-red-600 border border-red-100">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 5. Empty State */}
      {!isLoading && !error && hasSearched && markets.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#e5e5ea] bg-white py-14 text-center text-[#86868b]">
          <Inbox className="h-8 w-8 text-[#c7c7cc]" />
          <p className="text-sm font-semibold text-[#111113]">
            No active markets found
          </p>
          <p className="text-xs text-[#86868b]">
            Try a different category or search term.
          </p>
        </div>
      )}

      {/* 6. 2-Column Market Card Grid */}
      {!isLoading && markets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {markets.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              isSelected={selectedMarket?.id === market.id}
              onSelect={onSelectMarket}
            />
          ))}
        </div>
      )}
    </div>
  );
}
