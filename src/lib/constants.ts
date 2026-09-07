// ============================================================
// Polymarket AI Widget — Application Constants
// Single source of truth for demo profile and financial presets
// ============================================================

/**
 * Single source of truth for the demo profile UUID in Supabase.
 * Database profile: f07d5b04-96ab-4fd7-97ad-fc1056644be1
 */
export const DEMO_USER_ID =
  process.env.NEXT_PUBLIC_DEMO_USER_ID || 'f07d5b04-96ab-4fd7-97ad-fc1056644be1';

/** Alias for backward compatibility */
export const DEMO_PROFILE_ID = DEMO_USER_ID;

/** Default initial balance for new virtual paper trading profiles */
export const INITIAL_BALANCE = parseFloat(
  process.env.NEXT_PUBLIC_INITIAL_BALANCE ?? '1000',
);
