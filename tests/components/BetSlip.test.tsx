import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BetSlip } from '@/components/widget/BetSlip';

const mockMarket = {
  id: 'mkt-1',
  question: 'Will Bitcoin reach $100k by December?',
  outcomes: ['YES', 'NO'],
  outcomePrices: [0.65, 0.35],
  volume: 1500000,
  description: '',
  slug: 'will-bitcoin-reach-100k',
  active: true,
  closed: false,
  clobTokenIds: ['tok-1', 'tok-2'],
  endDate: '2026-12-31T00:00:00Z',
  image: '',
};

describe('<BetSlip/> Component', () => {
  it('renders custom outcome labels instead of hardcoded YES/NO', () => {
    const customMarket = {
      ...mockMarket,
      outcomes: ['Arsenal', 'Chelsea'],
      outcomePrices: [0.58, 0.42],
    };

    render(
      <BetSlip
        market={customMarket as any}
        onPlaceBet={vi.fn()}
        virtualBalance={915.00}
      />
    );

    expect(screen.getByText('Arsenal')).toBeInTheDocument();
    expect(screen.getByText('Chelsea')).toBeInTheDocument();
  });

  it('disables submit button and shows warning if bet exceeds balance', () => {
    render(
      <BetSlip
        market={mockMarket as any}
        onPlaceBet={vi.fn()}
        virtualBalance={50.00}
      />
    );

    const input = screen.getByPlaceholderText(/0.00/i) || screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '100' } });

    const submitBtn = screen.getByRole('button', { name: /Place Bet/i });
    expect(submitBtn).toBeDisabled();
  });
});
