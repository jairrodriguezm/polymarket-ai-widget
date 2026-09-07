import { describe, it, expect } from 'vitest';

interface RawMarketData {
  outcomes?: string | string[];
  outcomePrices?: string | string[];
  volume?: number;
  endDate?: string;
  startDate?: string;
}

export function normalizeMarketOutcomes(data: RawMarketData) {
  let outcomes: string[] = ['YES', 'NO'];
  let prices: number[] = [0.5, 0.5];

  if (typeof data.outcomes === 'string') {
    try {
      const parsed = JSON.parse(data.outcomes);
      if (Array.isArray(parsed) && parsed.length > 0) outcomes = parsed;
    } catch {
      outcomes = ['YES', 'NO'];
    }
  } else if (Array.isArray(data.outcomes) && data.outcomes.length > 0) {
    outcomes = data.outcomes;
  }

  if (typeof data.outcomePrices === 'string') {
    try {
      const parsed = JSON.parse(data.outcomePrices);
      if (Array.isArray(parsed)) prices = parsed.map(Number);
    } catch {
      prices = [0.5, 0.5];
    }
  } else if (Array.isArray(data.outcomePrices)) {
    prices = data.outcomePrices.map(Number);
  }

  return { outcomes, prices };
}

describe('Polymarket Data Normalization', () => {
  it('parses stringified JSON outcomes from Gamma API', () => {
    const raw = {
      outcomes: '["Over 2.5", "Under 2.5"]',
      outcomePrices: '["0.65", "0.35"]',
    };
    const result = normalizeMarketOutcomes(raw);
    expect(result.outcomes).toEqual(['Over 2.5', 'Under 2.5']);
    expect(result.prices).toEqual([0.65, 0.35]);
  });

  it('falls back to default YES/NO when outcomes are missing or corrupted', () => {
    const corrupted = { outcomes: 'invalid-json' };
    const result = normalizeMarketOutcomes(corrupted);
    expect(result.outcomes).toEqual(['YES', 'NO']);
    expect(result.prices).toEqual([0.5, 0.5]);
  });

  it('correctly sorts markets by ending_soon without returning past events', () => {
    const now = new Date('2026-09-07T12:00:00Z').getTime();
    const markets = [
      { id: '1', endDate: '2026-09-07T10:00:00Z' }, // expired
      { id: '2', endDate: '2026-09-08T12:00:00Z' }, // in 24h
      { id: '3', endDate: '2026-09-07T14:00:00Z' }, // in 2h
    ];

    const sortedActive = markets
      .filter((m) => new Date(m.endDate).getTime() > now)
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

    expect(sortedActive.map((m) => m.id)).toEqual(['3', '2']);
  });
});
