'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { supabase } from '@/lib/supabase';
import { DEMO_USER_ID, DEMO_PROFILE_ID, INITIAL_BALANCE } from '@/lib/constants';
import type { Bet } from '@/types';

export { DEMO_USER_ID, DEMO_PROFILE_ID, INITIAL_BALANCE };

interface PortfolioContextType {
  virtualBalance: number;
  setVirtualBalance: React.Dispatch<React.SetStateAction<number>>;
  profileId: string;
  bets: Bet[];
  isLoadingBets: boolean;
  isMyBetsModalOpen: boolean;
  setIsMyBetsModalOpen: (open: boolean) => void;
  openMyBetsModal: () => void;
  closeMyBetsModal: () => void;
  refreshPortfolio: () => Promise<void>;
  recordBet: (betPayload: Omit<Bet, 'id' | 'created_at'>) => Promise<Bet>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(
  undefined,
);

/**
 * Synchronizes the demo profile with the single source of truth (DEMO_USER_ID).
 * Fetches the existing balance directly from Supabase, or seeds if missing.
 */
export async function fetchOrCreateDemoProfile(): Promise<{
  id: string;
  virtual_balance: number;
}> {
  try {
    const { data: profile, error: fetchErr } = await supabase
      .from('profiles')
      .select('id, virtual_balance')
      .eq('id', DEMO_USER_ID)
      .maybeSingle();

    if (fetchErr) {
      console.warn('[Portfolio] Profile fetch notice:', fetchErr.message);
    }

    if (profile) {
      return {
        id: profile.id,
        virtual_balance: Number(profile.virtual_balance),
      };
    }

    // If no profile exists with DEMO_USER_ID, seed the single source of truth profile
    const { data: newProfile, error: insertErr } = await supabase
      .from('profiles')
      .upsert(
        {
          id: DEMO_USER_ID,
          username: 'Demo User',
          virtual_balance: INITIAL_BALANCE,
        },
        { onConflict: 'id' },
      )
      .select('id, virtual_balance')
      .single();

    if (insertErr) {
      console.warn('[Portfolio] Profile auto-creation fallback:', insertErr.message);
      return { id: DEMO_USER_ID, virtual_balance: INITIAL_BALANCE };
    }

    return {
      id: newProfile?.id ?? DEMO_USER_ID,
      virtual_balance: Number(newProfile?.virtual_balance ?? INITIAL_BALANCE),
    };
  } catch (err) {
    console.warn('[Portfolio] Profile resolution fallback:', err);
    return { id: DEMO_USER_ID, virtual_balance: INITIAL_BALANCE };
  }
}

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [virtualBalance, setVirtualBalance] = useState<number>(INITIAL_BALANCE);
  const [profileId, setProfileId] = useState<string>(DEMO_USER_ID);
  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoadingBets, setIsLoadingBets] = useState<boolean>(true);
  const [isMyBetsModalOpen, setIsMyBetsModalOpen] = useState<boolean>(false);

  const openMyBetsModal = useCallback(() => setIsMyBetsModalOpen(true), []);
  const closeMyBetsModal = useCallback(() => setIsMyBetsModalOpen(false), []);

  // Fetch portfolio data: profile balance and bets list specifically for DEMO_USER_ID
  const refreshPortfolio = useCallback(async () => {
    setIsLoadingBets(true);
    try {
      // 1. Fetch balance from Supabase for DEMO_USER_ID
      const prof = await fetchOrCreateDemoProfile();
      setProfileId(prof.id);
      setVirtualBalance(prof.virtual_balance);

      // 2. Fetch all bets placed by DEMO_USER_ID
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('profile_id', DEMO_USER_ID)
        .order('created_at', { ascending: false });

      if (betsError) {
        console.warn('[PortfolioContext] Bets fetch error:', betsError.message);
      } else if (betsData) {
        setBets(betsData as Bet[]);
      }
    } catch (err) {
      console.warn('[PortfolioContext] Refresh portfolio error:', err);
    } finally {
      setIsLoadingBets(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    refreshPortfolio();
  }, [refreshPortfolio]);

  // Supabase Realtime Subscription: listen for balance & bets changes
  useEffect(() => {
    // Realtime channel for profiles table updates
    const profileChannel = supabase
      .channel(`profile-balance-${DEMO_USER_ID}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${DEMO_USER_ID}`,
        },
        (payload) => {
          if (payload.new && 'virtual_balance' in payload.new) {
            const nextBal = Number(payload.new.virtual_balance);
            setVirtualBalance(nextBal);
          }
        },
      )
      .subscribe();

    // Realtime channel for bets table changes
    const betsChannel = supabase
      .channel(`bets-sync-${DEMO_USER_ID}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bets',
          filter: `profile_id=eq.${DEMO_USER_ID}`,
        },
        () => {
          // Re-fetch bets when new bet inserted or updated
          refreshPortfolio();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(betsChannel);
    };
  }, [refreshPortfolio]);

  // Record bet with optimistic updates and server persistence
  const recordBet = useCallback(
    async (betPayload: Omit<Bet, 'id' | 'created_at'>): Promise<Bet> => {
      const activeProfileId = betPayload.profile_id || DEMO_USER_ID;

      // 1. Optimistically deduct balance
      setVirtualBalance((prev) => Math.max(0, prev - betPayload.total_invested));

      // 2. Optimistic bet item
      const optimisticBet: Bet = {
        ...betPayload,
        profile_id: activeProfileId,
        created_at: new Date().toISOString(),
      };
      setBets((prev) => [optimisticBet, ...prev]);

      try {
        // 3. Persist bet to Supabase
        const { data: insertedData, error: insertError } = await supabase
          .from('bets')
          .insert([{ ...betPayload, profile_id: activeProfileId }])
          .select()
          .single();

        if (insertError) {
          if (
            insertError.message?.includes('bets_outcome_check') ||
            insertError.code === '23514' ||
            insertError.details?.includes('bets_outcome_check')
          ) {
            throw new Error(
              `Database constraint error: The bets table currently rejects dynamic outcome "${betPayload.outcome}". Please run this SQL in Supabase: ALTER TABLE bets DROP CONSTRAINT IF EXISTS bets_outcome_check; ALTER TABLE bets ADD CONSTRAINT bets_outcome_check CHECK (length(trim(outcome)) > 0);`,
            );
          }
          throw new Error(insertError.message || 'Failed to record paper bet.');
        }

        // 4. Update virtual balance in profiles table using DEMO_USER_ID
        const nextBalance = Math.max(0, virtualBalance - betPayload.total_invested);
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({ virtual_balance: nextBalance })
          .eq('id', activeProfileId);

        if (balanceError) {
          console.warn('[PortfolioContext] Profile balance update notice:', balanceError.message);
        }

        if (insertedData) {
          setBets((prev) => [insertedData, ...prev.filter((b) => b !== optimisticBet)]);
          return insertedData;
        }

        return optimisticBet;
      } catch (err) {
        // Rollback optimistic updates on failure
        setVirtualBalance((prev) => prev + betPayload.total_invested);
        setBets((prev) => prev.filter((b) => b !== optimisticBet));
        throw err;
      }
    },
    [virtualBalance],
  );

  return (
    <PortfolioContext.Provider
      value={{
        virtualBalance,
        setVirtualBalance,
        profileId,
        bets,
        isLoadingBets,
        isMyBetsModalOpen,
        setIsMyBetsModalOpen,
        openMyBetsModal,
        closeMyBetsModal,
        refreshPortfolio,
        recordBet,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    return {
      virtualBalance: 1000.0,
      setVirtualBalance: () => {},
      profileId: DEMO_USER_ID,
      bets: [],
      isLoadingBets: false,
      isMyBetsModalOpen: false,
      setIsMyBetsModalOpen: () => {},
      openMyBetsModal: () => {},
      closeMyBetsModal: () => {},
      refreshPortfolio: async () => {},
      recordBet: async (payload: any) => payload,
    };
  }
  return context;
}
