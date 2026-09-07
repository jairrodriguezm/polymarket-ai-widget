-- ==============================================================================
-- Polymarket AI Predictor — Full Supabase PostgreSQL Schema
-- ==============================================================================

-- 1. Profiles Table: Manages paper trading virtual balances
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL DEFAULT 'Demo Trader',
  virtual_balance NUMERIC DEFAULT 1000.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Bets Table: Tracks paper trading execution with dynamic outcomes
CREATE TABLE IF NOT EXISTS public.bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  market_id TEXT NOT NULL,
  market_question TEXT NOT NULL,
  outcome TEXT NOT NULL,
  shares NUMERIC NOT NULL,
  price_per_share NUMERIC NOT NULL,
  total_invested NUMERIC NOT NULL,
  potential_payout NUMERIC NOT NULL,
  ai_assisted BOOLEAN DEFAULT false,
  ai_confidence NUMERIC,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'WON', 'LOST', 'REFUNDED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT bets_outcome_check CHECK (length(trim(outcome)) > 0)
);

-- 3. Indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_bets_profile_id ON public.bets(profile_id);
CREATE INDEX IF NOT EXISTS idx_bets_market_id ON public.bets(market_id);
CREATE INDEX IF NOT EXISTS idx_bets_created_at ON public.bets(created_at DESC);

-- 4. Constraint update migration (safe for existing tables)
ALTER TABLE public.bets DROP CONSTRAINT IF EXISTS bets_outcome_check;
ALTER TABLE public.bets ADD CONSTRAINT bets_outcome_check CHECK (length(trim(outcome)) > 0);
