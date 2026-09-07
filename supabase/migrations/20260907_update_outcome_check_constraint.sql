-- ==============================================================================
-- Migration: Update outcome check constraint on public.bets for dynamic outcomes
-- ==============================================================================

-- 1. Drop the legacy check constraint restricting outcome to ('YES', 'NO')
ALTER TABLE public.bets DROP CONSTRAINT IF EXISTS bets_outcome_check;

-- 2. Add modern dynamic check constraint ensuring outcome is non-empty after trimming
ALTER TABLE public.bets ADD CONSTRAINT bets_outcome_check CHECK (length(trim(outcome)) > 0);
