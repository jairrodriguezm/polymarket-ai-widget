import type { Market, SortOption } from '@/types';

// ── Raw shapes from the Gamma API & Proxy ─────────────────────────────

interface GammaMarketRaw {
  id: string;
  title?: string;
  question?: string;
  groupItemTitle?: string;
  description?: string;
  slug?: string;
  active?: boolean;
  closed?: boolean;
  resolved?: boolean;
  volume?: string | number;
  clobTokenIds?: string | string[];
  outcomePrices?: string | string[] | number[];
  outcomes?: string | string[];
  endDate?: string;
  startDate?: string;
  createdAt?: string;
  image?: string | null;
}

interface GammaEventRaw {
  id: string;
  title?: string;
  slug?: string;
  description?: string;
  volume?: string | number;
  active?: boolean;
  closed?: boolean;
  resolved?: boolean;
  endDate?: string;
  startDate?: string;
  createdAt?: string;
  image?: string | null;
  markets?: GammaMarketRaw[];
  outcomes?: string | string[];
  outcomePrices?: string | string[] | number[];
  clobTokenIds?: string | string[];
}

// ── Parsing Helpers ────────────────────────────────────────────────────

/**
 * Hardened outcome prices parser:
 * - if it's a JSON string, parse it
 * - if it's already an array, use it
 * - if missing or invalid, fallback to [0.5, 0.5]
 */
function parseOutcomePrices(raw: GammaMarketRaw['outcomePrices']): number[] {
  const fallback = [0.5, 0.5];

  if (raw == null) {
    return fallback;
  }

  let parsed: unknown = raw;

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return fallback;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return fallback;
    }
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return fallback;
  }

  const numeric = parsed.map((item) => {
    const n = typeof item === 'number' ? item : parseFloat(String(item));
    return isNaN(n) ? 0.5 : n;
  });

  if (numeric.length === 0) {
    return fallback;
  }

  if (numeric.length === 1) {
    return [numeric[0], parseFloat((1 - numeric[0]).toFixed(4))];
  }

  return numeric;
}

function isMarketOpen(raw: GammaMarketRaw, eventFallback?: GammaEventRaw): boolean {
  if (raw.closed === true || eventFallback?.closed === true) return false;
  if (raw.active === false || eventFallback?.active === false) return false;
  if (raw.resolved === true || eventFallback?.resolved === true) return false;

  // 2. Check if resolution/end date has already passed
  const endDateStr = raw.endDate || eventFallback?.endDate;
  if (endDateStr) {
    const endTimestamp = new Date(endDateStr).getTime();
    if (!isNaN(endTimestamp) && endTimestamp < Date.now()) {
      return false;
    }
  }

  // 3. Check outcome prices for fully settled/resolved markets (e.g. YES 0 / NO 1 or vice versa)
  const prices = parseOutcomePrices(raw.outcomePrices);
  if (prices.length >= 2) {
    const [yes, no] = prices;
    if (
      (!isNaN(yes) && yes >= 0.995 && !isNaN(no) && no <= 0.005) ||
      (!isNaN(yes) && yes <= 0.005 && !isNaN(no) && no >= 0.995)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Safely extract clobTokenIds (handling stringified JSON vs native array).
 */
function parseClobTokenIds(raw: GammaMarketRaw['clobTokenIds']): string[] {
  if (raw == null) return [];

  if (Array.isArray(raw)) {
    return raw.map(String);
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }
      return [String(parsed)];
    } catch {
      return [trimmed];
    }
  }

  return [];
}

/**
 * Safely parse outcomes array (YES/NO defaults, Over/Under, Candidate names, etc.).
 */
function parseOutcomes(raw: unknown): string[] {
  const fallback = ['YES', 'NO'];
  if (raw == null) return fallback;

  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return fallback;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return fallback;
    }
  }

  if (Array.isArray(parsed) && parsed.length > 0) {
    const stringArray = parsed
      .map((item) => String(item).trim())
      .filter((s) => s.length > 0);
    if (stringArray.length > 0) {
      return stringArray;
    }
  }

  return fallback;
}

/**
 * Normalizes an individual market, safely disambiguating sub-markets from parent events.
 * For multi-outcome events (e.g. "Fed Decision in September?"), uses groupItemTitle or
 * market.question to formulate a clear title like "Fed Decision: 25 bps cut".
 */
function normalizeMarket(raw: GammaMarketRaw, eventFallback?: GammaEventRaw): Market {
  const clobTokenIds = parseClobTokenIds(
    raw.clobTokenIds || eventFallback?.clobTokenIds,
  );
  const outcomePrices = parseOutcomePrices(raw.outcomePrices ?? eventFallback?.outcomePrices);
  const outcomes = parseOutcomes(raw.outcomes ?? eventFallback?.outcomes);

  const eventTitle = eventFallback?.title?.trim();
  const rawQuestion = raw.question?.trim();
  const groupItemTitle = raw.groupItemTitle?.trim();
  const rawTitle = raw.title?.trim();

  let question: string;

  if (groupItemTitle) {
    if (eventTitle && !eventTitle.toLowerCase().includes(groupItemTitle.toLowerCase())) {
      // Clean trailing punctuation from event title
      const cleanEventTitle = eventTitle.replace(/[\?:!.]+$/, '').trim();
      question = `${cleanEventTitle}: ${groupItemTitle}`;
    } else {
      question = groupItemTitle;
    }
  } else if (rawQuestion && eventTitle && rawQuestion.toLowerCase() !== eventTitle.toLowerCase()) {
    // Specific question differs from event title (e.g., bracket or specific condition)
    question = rawQuestion;
  } else if (rawQuestion) {
    question = rawQuestion;
  } else if (eventTitle) {
    question = eventTitle;
  } else if (rawTitle) {
    question = rawTitle;
  } else {
    question = 'Prediction Market';
  }

  const rawVolume = raw.volume ?? eventFallback?.volume ?? 0;
  const volume =
    typeof rawVolume === 'number' ? rawVolume : parseFloat(String(rawVolume)) || 0;

  const eventSlug = eventFallback?.slug?.trim();
  const rawSlug = raw.slug?.trim();
  const slug = eventSlug || rawSlug || '';

  return {
    id: raw.id || `${eventFallback?.id || 'm'}-${rawSlug || Math.random().toString(36).slice(2, 8)}`,
    question,
    description: raw.description ?? eventFallback?.description ?? '',
    slug,
    eventSlug: eventSlug || undefined,
    marketSlug: rawSlug || undefined,
    active: raw.active ?? true,
    closed: raw.closed ?? false,
    volume,
    clobTokenIds,
    outcomePrices,
    outcomes,
    endDate: raw.endDate ?? eventFallback?.endDate ?? '',
    startDate: raw.startDate ?? eventFallback?.startDate ?? undefined,
    createdAt: raw.createdAt ?? eventFallback?.createdAt ?? undefined,
    image: eventFallback?.image || raw.image || null,
    groupItemTitle: groupItemTitle || undefined,
    eventTitle: eventTitle || undefined,
  };
}

// ── Public Service Method ──────────────────────────────────────────────

/**
 * Searches markets via internal proxy (/api/markets).
 * Supports both query search and vertical category filtering.
 * Filter out closed/resolved markets defensively.
 * Deduplicates by unique market.id.
 */
export async function searchMarkets(
  query: string = '',
  category?: string,
  sort: SortOption = 'volume',
): Promise<Market[]> {
  try {
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set('q', query.trim());
    } else if (category?.trim()) {
      params.set('category', category.trim());
    }
    if (sort) {
      params.set('sort', sort);
    }

    const url = `/api/markets${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error('[PolymarketService] API proxy responded with status:', res.status);
      return [];
    }

    const data: unknown = await res.json();

    // Support both direct arrays (data as Event[]) and wrapped responses (data.events)
    let rawEvents: GammaEventRaw[] = [];

    if (Array.isArray(data)) {
      rawEvents = data as GammaEventRaw[];
    } else if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.events)) {
        rawEvents = obj.events as GammaEventRaw[];
      } else if (Array.isArray(obj.markets)) {
        rawEvents = (obj.markets as GammaMarketRaw[]).map((m) => ({
          id: m.id,
          title: m.question || m.title,
          markets: [m],
        }));
      }
    }

    if (rawEvents.length === 0) {
      return [];
    }

    const seenIds = new Set<string>();
    const markets: Market[] = [];

    for (const event of rawEvents) {
      // Discard closed/resolved events
      if (event.closed === true || event.active === false || event.resolved === true) {
        continue;
      }

      if (Array.isArray(event.markets) && event.markets.length > 0) {
        for (const m of event.markets) {
          // Discard closed/resolved sub-markets
          if (isMarketOpen(m, event)) {
            const marketId = m.id || `${event.id}-${m.slug || m.question || Math.random()}`;
            if (!seenIds.has(marketId)) {
              seenIds.add(marketId);
              markets.push(normalizeMarket({ ...m, id: marketId }, event));
            }
          }
        }
      } else {
        const directMarket = event as unknown as GammaMarketRaw;
        if (isMarketOpen(directMarket, event)) {
          const marketId = directMarket.id || event.id;
          if (!seenIds.has(marketId)) {
            seenIds.add(marketId);
            markets.push(normalizeMarket({ ...directMarket, id: marketId }, event));
          }
        }
      }
    }

    // Apply sorting consistently
    if (sort === 'ending_soon') {
      const now = Date.now();
      const validEndingSoon = markets.filter((m) => {
        if (!m.endDate) return false;
        const endTime = new Date(m.endDate).getTime();
        return !isNaN(endTime) && endTime > now;
      });
      validEndingSoon.sort((a, b) => {
        const dateA = new Date(a.endDate).getTime();
        const dateB = new Date(b.endDate).getTime();
        return dateA - dateB;
      });
      return validEndingSoon;
    }

    if (sort === 'newest') {
      markets.sort((a, b) => {
        const dateA = new Date(a.startDate || a.createdAt || a.endDate || 0).getTime();
        const dateB = new Date(b.startDate || b.createdAt || b.endDate || 0).getTime();
        return dateB - dateA;
      });
      return markets;
    }

    // Default: volume descending
    markets.sort((a, b) => (b.volume || 0) - (a.volume || 0));
    return markets;
  } catch (error) {
    console.error('[PolymarketService] searchMarkets failed:', error);
    return [];
  }
}
