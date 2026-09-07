// ============================================================
// Polymarket AI Widget — Shared Type Definitions
// ============================================================

/** Supported sorting options for market feed. */
export type SortOption = 'volume' | 'ending_soon' | 'newest';

/** Normalized market data from the Polymarket Gamma API. */
export interface Market {
  id: string;
  question: string;
  description: string;
  slug: string;
  active: boolean;
  closed: boolean;
  volume: number;
  clobTokenIds: string[];
  outcomePrices: number[];
  outcomes: string[];
  endDate: string;
  startDate?: string;
  createdAt?: string;
  image?: string | null;
  groupItemTitle?: string;
  eventTitle?: string;
  eventSlug?: string;
  marketSlug?: string;
}

/** Row stored in the Supabase `profiles` table. */
export interface Profile {
  id: string;
  username: string;
  virtual_balance: number;
  created_at: string;
}

/** Row stored in the Supabase `bets` table. */
export interface Bet {
  id?: string;
  profile_id: string;
  market_id: string;
  market_question: string;
  outcome: string;
  shares: number;
  price_per_share: number;
  total_invested: number;
  potential_payout: number;
  ai_assisted: boolean;
  ai_confidence: number | null;
  status: 'OPEN' | 'WON' | 'LOST' | 'REFUNDED';
  created_at?: string;
}

/** AI recommendation returned by the Gemini analysis route. */
export interface AIRecommendation {
  recommendedOutcome: 'YES' | 'NO';
  confidence: number;
  rationale: string;
  recommendedBetSize: number;
}

/** API error response shape. */
export interface APIError {
  error: string;
  details?: string;
}

/** Shape of the request body for /api/analyze-market. */
export interface AnalyzeMarketRequest {
  marketTitle: string;
  description: string;
}
