import { describe, it, expect } from 'vitest';

// Helper math functions (or imported from your utils/calculations file)
export function calculateShares(amount: number, price: number): number {
  if (price <= 0 || amount <= 0) return 0;
  return Number((amount / price).toFixed(2));
}

export function calculatePayout(shares: number): number {
  // Each winning share in Polymarket resolves to $1.00 USDC
  return Number(shares.toFixed(2));
}

export function calculateRoi(amount: number, payout: number): number {
  if (amount <= 0) return 0;
  return Number((((payout - amount) / amount) * 100).toFixed(1));
}

export function canPlaceBet(amount: number, virtualBalance: number): boolean {
  return amount > 0 && amount <= virtualBalance;
}

describe('Paper Trading Financial Math', () => {
  it('calculates correct shares for fractional prices', () => {
    // $100 placed on outcome priced at $0.50 -> 200 shares
    expect(calculateShares(100, 0.50)).toBe(200);
    // $85 placed on outcome priced at $0.66 -> 128.79 shares
    expect(calculateShares(85, 0.66)).toBe(128.79);
  });

  it('handles edge cases for zero or negative amount/price', () => {
    expect(calculateShares(0, 0.50)).toBe(0);
    expect(calculateShares(50, 0)).toBe(0);
    expect(calculateShares(-10, 0.50)).toBe(0);
  });

  it('calculates potential payout and ROI correctly', () => {
    const amount = 50;
    const price = 0.25;
    const shares = calculateShares(amount, price); // 200 shares
    const payout = calculatePayout(shares); // $200.00
    const roi = calculateRoi(amount, payout); // 300%

    expect(shares).toBe(200);
    expect(payout).toBe(200);
    expect(roi).toBe(300);
  });

  it('validates sufficient virtual balance', () => {
    const currentBalance = 915.00;
    expect(canPlaceBet(100, currentBalance)).toBe(true);
    expect(canPlaceBet(915, currentBalance)).toBe(true);
    expect(canPlaceBet(915.01, currentBalance)).toBe(false);
    expect(canPlaceBet(0, currentBalance)).toBe(false);
  });
});
