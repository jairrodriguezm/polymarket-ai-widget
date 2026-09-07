import { NextResponse } from 'next/server';

const GAMMA_API_URL =
  process.env.NEXT_PUBLIC_POLYMARKET_API_URL ??
  'https://gamma-api.polymarket.com';

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

// ── Realistic Fallback Events (Guaranteed Open with Future End Dates) ─
const FALLBACK_EVENTS = [
  // ── Ending Soon / Expiring Next ──
  {
    id: 'eth-options-expiry-near',
    category: 'ending-soon',
    title: 'Ethereum above $3,500 at upcoming close?',
    description:
      'Resolves to YES if Ethereum price closes above $3,500 at the upcoming close.',
    slug: 'eth-above-3500-close',
    volume: 780000,
    endDate: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-eth-3500-close',
        question: 'Ethereum above $3,500 at upcoming close?',
        description:
          'Resolves to YES if Ethereum price closes above $3,500 at the upcoming close.',
        slug: 'eth-above-3500-close',
        active: true,
        closed: false,
        volume: 780000,
        clobTokenIds: ['token-eth-soon-yes', 'token-eth-soon-no'],
        outcomePrices: ['0.61', '0.39'],
        outcomes: ['Yes', 'No'],
        endDate: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'btc-intraday-resistance',
    category: 'ending-soon',
    title: 'Bitcoin above $95,000 in the next 24 hours?',
    description:
      'Resolves to YES if BTC touches or exceeds $95,000 according to Binance Index within 24 hours.',
    slug: 'btc-above-95k-24h',
    volume: 1250000,
    endDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-btc-95k-24h',
        question: 'Bitcoin above $95,000 in the next 24 hours?',
        description:
          'Resolves to YES if BTC touches or exceeds $95,000 according to Binance Index within 24 hours.',
        slug: 'btc-above-95k-24h',
        active: true,
        closed: false,
        volume: 1250000,
        clobTokenIds: ['token-btc-soon-yes', 'token-btc-soon-no'],
        outcomePrices: ['0.74', '0.26'],
        outcomes: ['Yes', 'No'],
        endDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      },
    ],
  },
  // ── Trending / Economy ──
  {
    id: 'fed-rate-cut-2026',
    category: 'trending',
    title: 'Fed decreases interest rates at next FOMC meeting?',
    description:
      'Resolves to YES if the Federal Open Market Committee announces a reduction in the target range for the federal funds rate at their next scheduled meeting. Based on official Federal Reserve statements.',
    slug: 'fed-rate-cut-2026',
    volume: 1425000,
    endDate: '2026-12-31T23:59:59Z',
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-fed-rate-cut-25bps',
        groupItemTitle: '25 bps cut',
        question: 'Will the Fed cut interest rates by 25 bps?',
        description:
          'Resolves to YES if the Federal Open Market Committee announces a 25 basis point reduction.',
        slug: 'fed-rate-cut-25bps',
        active: true,
        closed: false,
        volume: 850000,
        clobTokenIds: ['token-fed-25-yes', 'token-fed-25-no'],
        outcomePrices: ['0.68', '0.32'],
        outcomes: ['Yes', 'No'],
        endDate: '2026-12-31T23:59:59Z',
      },
      {
        id: 'm-fed-rate-cut-50bps',
        groupItemTitle: '50 bps cut',
        question: 'Will the Fed cut interest rates by 50 bps?',
        description:
          'Resolves to YES if the Federal Open Market Committee announces a 50 basis point reduction.',
        slug: 'fed-rate-cut-50bps',
        active: true,
        closed: false,
        volume: 320000,
        clobTokenIds: ['token-fed-50-yes', 'token-fed-50-no'],
        outcomePrices: ['0.18', '0.82'],
        outcomes: ['Yes', 'No'],
        endDate: '2026-12-31T23:59:59Z',
      },
      {
        id: 'm-fed-rate-no-change',
        groupItemTitle: 'No change',
        question: 'Will the Fed hold interest rates unchanged?',
        description:
          'Resolves to YES if the Federal Open Market Committee announces no change in the target range.',
        slug: 'fed-rate-no-change',
        active: true,
        closed: false,
        volume: 255000,
        clobTokenIds: ['token-fed-hold-yes', 'token-fed-hold-no'],
        outcomePrices: ['0.14', '0.86'],
        outcomes: ['Yes', 'No'],
        endDate: '2026-12-31T23:59:59Z',
      },
    ],
  },
  {
    id: 'ai-agi-benchmark-2026',
    category: 'trending',
    title: 'Will an AI model achieve 90%+ on ARC-AGI benchmark before 2027?',
    description:
      'Resolves to YES if a verified AI model achieves 90% or higher accuracy on the official ARC-AGI benchmark before January 1, 2027.',
    slug: 'ai-agi-benchmark-2026',
    volume: 620000,
    endDate: '2026-12-31T23:59:59Z',
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-ai-agi-benchmark-2026',
        question:
          'Will an AI model achieve 90%+ on ARC-AGI benchmark before 2027?',
        description:
          'Resolves to YES if any model achieves 90% or higher on ARC-AGI benchmark.',
        slug: 'ai-agi-benchmark-2026',
        active: true,
        closed: false,
        volume: 620000,
        clobTokenIds: ['token-agi-yes', 'token-agi-no'],
        outcomePrices: ['0.73', '0.27'],
        outcomes: ['Yes', 'No'],
        endDate: '2026-12-31T23:59:59Z',
      },
    ],
  },

  // ── Crypto ──
  {
    id: 'btc-120k-milestone-2026',
    category: 'crypto',
    title: 'Will Bitcoin reach $150,000 before end of 2026?',
    description:
      'Resolves to YES if Bitcoin (BTC) trades at or above $150,000 according to Coinbase/Binance index pricing before January 1, 2027.',
    slug: 'btc-150k-2026',
    volume: 3890000,
    endDate: '2026-12-31T23:59:59Z',
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-btc-150k-2026',
        question: 'Will Bitcoin reach $150,000 before end of 2026?',
        description:
          'Resolves to YES if Bitcoin trades at or above $150,000 before 2027.',
        slug: 'btc-150k-2026',
        active: true,
        closed: false,
        volume: 3890000,
        clobTokenIds: ['token-btc-yes', 'token-btc-no'],
        outcomePrices: ['0.54', '0.46'],
        outcomes: ['Yes', 'No'],
        endDate: '2026-12-31T23:59:59Z',
      },
    ],
  },
  {
    id: 'eth-etf-inflows-2026',
    category: 'crypto',
    title: 'Ethereum ETF cumulative net inflows surpass $15B in 2026?',
    description:
      'Resolves to YES if cumulative net inflows to US spot Ethereum ETFs exceed $15 billion according to Farside Investors data.',
    slug: 'eth-etf-inflows-2026',
    volume: 870000,
    endDate: '2026-12-31T23:59:59Z',
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-eth-etf-inflows-2026',
        question: 'Will Ethereum ETF cumulative net inflows surpass $15B in 2026?',
        description:
          'Cumulative spot Ethereum ETF net inflows benchmark for 2026.',
        slug: 'eth-etf-inflows-2026',
        active: true,
        closed: false,
        volume: 870000,
        clobTokenIds: ['token-eth-yes', 'token-eth-no'],
        outcomePrices: ['0.41', '0.59'],
        outcomes: ['Yes', 'No'],
        endDate: '2026-12-31T23:59:59Z',
      },
    ],
  },

  // ── Politics ──
  {
    id: 'us-ai-governance-act-2026',
    category: 'politics',
    title: 'US Senate passes comprehensive AI Regulatory Framework in 2026?',
    description:
      'Resolves to YES if the United States Senate passes binding federal legislation establishing safety benchmarks and mandatory licensing for frontier models.',
    slug: 'us-ai-act-2026',
    volume: 760000,
    endDate: '2026-12-31T23:59:59Z',
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-us-ai-act-2026',
        question: 'Will the US Senate pass a comprehensive AI framework in 2026?',
        description: 'Bipartisan US Senate Artificial Intelligence framework legislation.',
        slug: 'us-ai-act-2026',
        active: true,
        closed: false,
        volume: 760000,
        clobTokenIds: ['token-pol-yes', 'token-pol-no'],
        outcomePrices: ['0.43', '0.57'],
        outcomes: ['Yes', 'No'],
        endDate: '2026-12-31T23:59:59Z',
      },
    ],
  },
  {
    id: 'sec-crypto-guidance-2026',
    category: 'politics',
    title: 'SEC issues formal registration guidelines for DeFi in 2026?',
    description:
      'Resolves to YES if the US Securities and Exchange Commission formally issues revised guidance establishing distinct registration criteria for non-custodial decentralized protocols.',
    slug: 'sec-defi-guidance-2026',
    volume: 510000,
    endDate: '2026-12-31T23:59:59Z',
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-sec-defi-2026',
        question: 'Will the SEC issue revised DeFi protocol guidance in 2026?',
        description: 'SEC administrative guidance regarding non-custodial DeFi.',
        slug: 'sec-defi-guidance-2026',
        active: true,
        closed: false,
        volume: 510000,
        clobTokenIds: ['token-sec-yes', 'token-sec-no'],
        outcomePrices: ['0.61', '0.39'],
        outcomes: ['Yes', 'No'],
        endDate: '2026-12-31T23:59:59Z',
      },
    ],
  },

  // ── Sports ──
  {
    id: 'champions-league-2027',
    category: 'sports',
    title: 'UEFA Champions League 2026-27 Winner',
    description:
      'Resolves to the club that wins the final of the 2026-27 UEFA Champions League.',
    slug: 'ucl-winner-2027',
    volume: 2820000,
    endDate: '2027-05-31T23:59:59Z',
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-ucl-realmadrid-2027',
        groupItemTitle: 'Real Madrid',
        question: 'Will Real Madrid win the UEFA Champions League?',
        description: 'UEFA Champions League tournament winner.',
        slug: 'real-madrid-ucl-2027',
        active: true,
        closed: false,
        volume: 1220000,
        clobTokenIds: ['token-ucl-rm-yes', 'token-ucl-rm-no'],
        outcomePrices: ['0.36', '0.64'],
        outcomes: ['Yes', 'No'],
        endDate: '2027-05-31T23:59:59Z',
      },
      {
        id: 'm-ucl-mancity-2027',
        groupItemTitle: 'Manchester City',
        question: 'Will Manchester City win the UEFA Champions League?',
        description: 'UEFA Champions League tournament winner.',
        slug: 'man-city-ucl-2027',
        active: true,
        closed: false,
        volume: 1100000,
        clobTokenIds: ['token-ucl-mc-yes', 'token-ucl-mc-no'],
        outcomePrices: ['0.32', '0.68'],
        outcomes: ['Yes', 'No'],
        endDate: '2027-05-31T23:59:59Z',
      },
    ],
  },
  {
    id: 'world-cup-2026',
    category: 'sports',
    title: 'Will Brazil win the FIFA World Cup 2026?',
    description:
      'Resolves to YES if Brazil wins the 2026 FIFA World Cup final in North America.',
    slug: 'brazil-world-cup-2026',
    volume: 3450000,
    endDate: '2026-07-31T23:59:59Z',
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-brazil-world-cup-2026',
        question: 'Will Brazil win the FIFA World Cup 2026?',
        description: 'FIFA World Cup 2026 champion.',
        slug: 'brazil-world-cup-2026',
        active: true,
        closed: false,
        volume: 3450000,
        clobTokenIds: ['token-wc-bra-yes', 'token-wc-bra-no'],
        outcomePrices: ['0.22', '0.78'],
        outcomes: ['Yes', 'No'],
        endDate: '2026-07-31T23:59:59Z',
      },
    ],
  },

  // ── Pop Culture ──
  {
    id: 'gta6-release-window-2026',
    category: 'pop-culture',
    title: 'Grand Theft Auto VI officially ships before December 2026?',
    description:
      'Resolves to YES if Rockstar Games releases Grand Theft Auto VI before December 31, 2026.',
    slug: 'gta-6-release-2026',
    volume: 1280000,
    endDate: '2026-12-31T23:59:59Z',
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-gta6-release-2026',
        question: 'Will GTA VI officially ship before December 2026?',
        description: 'Rockstar Games Grand Theft Auto VI release date.',
        slug: 'gta-6-release-2026',
        active: true,
        closed: false,
        volume: 1280000,
        clobTokenIds: ['token-gta-yes', 'token-gta-no'],
        outcomePrices: ['0.76', '0.24'],
        outcomes: ['Yes', 'No'],
        endDate: '2026-12-31T23:59:59Z',
      },
    ],
  },
  {
    id: 'spacex-starship-payload-2026',
    category: 'pop-culture',
    title: 'SpaceX Starship deploys commercial payload into orbit in 2026?',
    description:
      'Resolves to YES if SpaceX Starship successfully deploys an operational commercial satellite payload into orbit during any 2026 flight.',
    slug: 'spacex-starship-payload-2026',
    volume: 530000,
    endDate: '2026-12-31T23:59:59Z',
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-spacex-starship-payload-2026',
        question:
          'SpaceX Starship deploys commercial payload into orbit in 2026?',
        description:
          'Commercial payload delivery to orbit by SpaceX Starship.',
        slug: 'spacex-starship-payload-2026',
        active: true,
        closed: false,
        volume: 530000,
        clobTokenIds: ['token-starship-yes', 'token-starship-no'],
        outcomePrices: ['0.82', '0.18'],
        outcomes: ['Yes', 'No'],
        endDate: '2026-12-31T23:59:59Z',
      },
    ],
  },

  // ── LatAm (Expanded Regional Markets with Future Dates) ─────────────
  {
    id: 'colombia-banrep-rate-2026',
    category: 'latam',
    title: 'Banco de la República cuts policy interest rate below 8.0% in 2026?',
    description:
      'Resolves to YES if the board of directors of Colombia’s Central Bank (Banco de la República) cuts the benchmark interest rate to below 8.00% at any policy meeting in 2026.',
    slug: 'colombia-banrep-rates-2026',
    volume: 410000,
    endDate: '2026-12-31T23:59:59Z',
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-colombia-banrep-2026',
        question: 'Will Colombia’s Banco de la República cut rates below 8.0% in 2026?',
        description: 'Monetary policy interest rate decision by Banco de la República Colombia.',
        slug: 'colombia-banrep-rates-2026',
        active: true,
        closed: false,
        volume: 410000,
        clobTokenIds: ['token-banrep-yes', 'token-banrep-no'],
        outcomePrices: ['0.65', '0.35'],
        outcomes: ['Yes', 'No'],
        endDate: '2026-12-31T23:59:59Z',
      },
    ],
  },
  {
    id: 'colombia-gdp-growth-2026',
    category: 'latam',
    title: 'Colombia GDP annual growth exceeds 2.5% in 2026?',
    description:
      'Resolves to YES if DANE reports that Colombia’s annual real GDP growth for 2026 exceeds 2.5%.',
    slug: 'colombia-gdp-2026',
    volume: 320000,
    endDate: '2026-12-31T23:59:59Z',
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-colombia-gdp-2026',
        question: 'Will Colombia GDP growth exceed 2.5% in 2026?',
        description: 'DANE annual economic growth publication for Colombia.',
        slug: 'colombia-gdp-2026',
        active: true,
        closed: false,
        volume: 320000,
        clobTokenIds: ['token-colgdp-yes', 'token-colgdp-no'],
        outcomePrices: ['0.48', '0.52'],
        outcomes: ['Yes', 'No'],
        endDate: '2026-12-31T23:59:59Z',
      },
    ],
  },
  {
    id: 'brazil-selic-rate-2026',
    category: 'latam',
    title: 'Banco Central do Brasil (BCB) cuts Selic rate in 2026?',
    description:
      'Resolves to YES if Copom (Comitê de Política Monetária) of Banco Central do Brasil announces an interest rate cut in 2026.',
    slug: 'brazil-selic-2026',
    volume: 580000,
    endDate: '2026-12-31T23:59:59Z',
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-brazil-selic-2026',
        question: 'Will Banco Central do Brasil cut Selic rate in 2026?',
        description: 'Copom interest rate monetary policy decision in Brazil.',
        slug: 'brazil-selic-2026',
        active: true,
        closed: false,
        volume: 580000,
        clobTokenIds: ['token-selic-yes', 'token-selic-no'],
        outcomePrices: ['0.52', '0.48'],
        outcomes: ['Yes', 'No'],
        endDate: '2026-12-31T23:59:59Z',
      },
    ],
  },
  {
    id: 'argentina-inflation-2026',
    category: 'latam',
    title: 'Argentina monthly inflation prints below 2.0% in 2026?',
    description:
      'Resolves to YES if INDEC reports monthly consumer price inflation (IPC) in Argentina below 2.0% in any month of 2026.',
    slug: 'argentina-inflation-2026',
    volume: 640000,
    endDate: '2026-12-31T23:59:59Z',
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-arg-inflation-2026',
        question: 'Will Argentina monthly inflation drop below 2.0% in 2026?',
        description: 'INDEC monthly IPC inflation release for Argentina.',
        slug: 'argentina-inflation-2026',
        active: true,
        closed: false,
        volume: 640000,
        clobTokenIds: ['token-arg-yes', 'token-arg-no'],
        outcomePrices: ['0.71', '0.29'],
        outcomes: ['Yes', 'No'],
        endDate: '2026-12-31T23:59:59Z',
      },
    ],
  },
  {
    id: 'mexico-banxico-rate-2026',
    category: 'latam',
    title: 'Banco de México (Banxico) policy rate below 8.5% in 2026?',
    description:
      'Resolves to YES if the Governing Board of Banco de México lowers the interbank target rate to below 8.50% at any monetary policy meeting in 2026.',
    slug: 'mexico-banxico-rate-2026',
    volume: 490000,
    endDate: '2026-12-31T23:59:59Z',
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-mex-banxico-2026',
        question: 'Will Banxico lower policy rate below 8.5% in 2026?',
        description: 'Banco de México monetary policy rate decision.',
        slug: 'mexico-banxico-rate-2026',
        active: true,
        closed: false,
        volume: 490000,
        clobTokenIds: ['token-banxico-yes', 'token-banxico-no'],
        outcomePrices: ['0.63', '0.37'],
        outcomes: ['Yes', 'No'],
        endDate: '2026-12-31T23:59:59Z',
      },
    ],
  },
  {
    id: 'chile-gdp-2026',
    category: 'latam',
    title: 'Chile annual GDP growth exceeds 2.4% in 2026?',
    description:
      'Resolves to YES if Banco Central de Chile reports annual GDP growth for 2026 above 2.4%.',
    slug: 'chile-gdp-2026',
    volume: 290000,
    endDate: '2026-12-31T23:59:59Z',
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-chile-gdp-2026',
        question: 'Will Chile GDP growth exceed 2.4% in 2026?',
        description: 'Banco Central de Chile GDP annual statistics.',
        slug: 'chile-gdp-2026',
        active: true,
        closed: false,
        volume: 290000,
        clobTokenIds: ['token-chile-yes', 'token-chile-no'],
        outcomePrices: ['0.44', '0.56'],
        outcomes: ['Yes', 'No'],
        endDate: '2026-12-31T23:59:59Z',
      },
    ],
  },

  // ── Soccer (Major Leagues & Tournaments with Future Dates) ─────────
  {
    id: 'soccer-ucl-2027',
    category: 'soccer',
    title: 'UEFA Champions League 2026-27 Winner',
    description:
      'Resolves to the club that wins the 2026-27 UEFA Champions League final.',
    slug: 'ucl-winner-2027',
    volume: 3850000,
    endDate: '2027-05-31T23:59:59Z',
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-ucl-realmadrid-2027',
        groupItemTitle: 'Real Madrid',
        question: 'Will Real Madrid win the UEFA Champions League 2026-27?',
        description: 'UEFA Champions League tournament winner.',
        slug: 'real-madrid-ucl-2027',
        active: true,
        closed: false,
        volume: 1850000,
        clobTokenIds: ['token-ucl-rm-yes', 'token-ucl-rm-no'],
        outcomePrices: ['0.34', '0.66'],
        outcomes: ['Yes', 'No'],
        endDate: '2027-05-31T23:59:59Z',
      },
      {
        id: 'm-ucl-mancity-2027',
        groupItemTitle: 'Manchester City',
        question: 'Will Manchester City win the UEFA Champions League 2026-27?',
        description: 'UEFA Champions League tournament winner.',
        slug: 'man-city-ucl-2027',
        active: true,
        closed: false,
        volume: 1400000,
        clobTokenIds: ['token-ucl-mc-yes', 'token-ucl-mc-no'],
        outcomePrices: ['0.31', '0.69'],
        outcomes: ['Yes', 'No'],
        endDate: '2027-05-31T23:59:59Z',
      },
      {
        id: 'm-ucl-bayern-2027',
        groupItemTitle: 'Bayern Munich',
        question: 'Will Bayern Munich win the UEFA Champions League 2026-27?',
        description: 'UEFA Champions League tournament winner.',
        slug: 'bayern-ucl-2027',
        active: true,
        closed: false,
        volume: 600000,
        clobTokenIds: ['token-ucl-bay-yes', 'token-ucl-bay-no'],
        outcomePrices: ['0.18', '0.82'],
        outcomes: ['Yes', 'No'],
        endDate: '2027-05-31T23:59:59Z',
      },
    ],
  },
  {
    id: 'soccer-premier-league-2027',
    category: 'soccer',
    title: 'English Premier League 2026-27 Champion',
    description:
      'Resolves to the club that finishes top of the English Premier League table at the end of the 2026-27 season.',
    slug: 'premier-league-winner-2027',
    volume: 2950000,
    endDate: '2027-05-31T23:59:59Z',
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-pl-arsenal-2027',
        groupItemTitle: 'Arsenal',
        question: 'Will Arsenal win the Premier League 2026-27?',
        description: 'English Premier League winner.',
        slug: 'arsenal-pl-2027',
        active: true,
        closed: false,
        volume: 1350000,
        clobTokenIds: ['token-pl-ars-yes', 'token-pl-ars-no'],
        outcomePrices: ['0.39', '0.61'],
        outcomes: ['Yes', 'No'],
        endDate: '2027-05-31T23:59:59Z',
      },
      {
        id: 'm-pl-liverpool-2027',
        groupItemTitle: 'Liverpool',
        question: 'Will Liverpool win the Premier League 2026-27?',
        description: 'English Premier League winner.',
        slug: 'liverpool-pl-2027',
        active: true,
        closed: false,
        volume: 1100000,
        clobTokenIds: ['token-pl-liv-yes', 'token-pl-liv-no'],
        outcomePrices: ['0.33', '0.67'],
        outcomes: ['Yes', 'No'],
        endDate: '2027-05-31T23:59:59Z',
      },
      {
        id: 'm-pl-mancity-2027',
        groupItemTitle: 'Manchester City',
        question: 'Will Manchester City win the Premier League 2026-27?',
        description: 'English Premier League winner.',
        slug: 'mancity-pl-2027',
        active: true,
        closed: false,
        volume: 500000,
        clobTokenIds: ['token-pl-mc-yes', 'token-pl-mc-no'],
        outcomePrices: ['0.28', '0.72'],
        outcomes: ['Yes', 'No'],
        endDate: '2027-05-31T23:59:59Z',
      },
    ],
  },
  {
    id: 'soccer-laliga-2027',
    category: 'soccer',
    title: 'Spanish La Liga 2026-27 Winner',
    description:
      'Resolves to the club that finishes first in Spain’s La Liga at the conclusion of the 2026-27 season.',
    slug: 'laliga-winner-2027',
    volume: 2150000,
    endDate: '2027-05-31T23:59:59Z',
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-laliga-barcelona-2027',
        groupItemTitle: 'FC Barcelona',
        question: 'Will FC Barcelona win La Liga 2026-27?',
        description: 'La Liga champion.',
        slug: 'barcelona-laliga-2027',
        active: true,
        closed: false,
        volume: 1150000,
        clobTokenIds: ['token-ll-bar-yes', 'token-ll-bar-no'],
        outcomePrices: ['0.52', '0.48'],
        outcomes: ['Yes', 'No'],
        endDate: '2027-05-31T23:59:59Z',
      },
      {
        id: 'm-laliga-realmadrid-2027',
        groupItemTitle: 'Real Madrid',
        question: 'Will Real Madrid win La Liga 2026-27?',
        description: 'La Liga champion.',
        slug: 'realmadrid-laliga-2027',
        active: true,
        closed: false,
        volume: 1000000,
        clobTokenIds: ['token-ll-rm-yes', 'token-ll-rm-no'],
        outcomePrices: ['0.48', '0.52'],
        outcomes: ['Yes', 'No'],
        endDate: '2027-05-31T23:59:59Z',
      },
    ],
  },
  {
    id: 'soccer-copa-libertadores-2026',
    category: 'soccer',
    title: 'CONMEBOL Copa Libertadores 2026 Champion',
    description:
      'Resolves to the club that wins the final of the 2026 CONMEBOL Copa Libertadores.',
    slug: 'copa-libertadores-2026',
    volume: 1650000,
    endDate: '2026-11-30T23:59:59Z',
    active: true,
    closed: false,
    markets: [
      {
        id: 'm-libertadores-flamengo-2026',
        groupItemTitle: 'Flamengo',
        question: 'Will Flamengo win Copa Libertadores 2026?',
        description: 'Copa Libertadores winner.',
        slug: 'flamengo-libertadores-2026',
        active: true,
        closed: false,
        volume: 750000,
        clobTokenIds: ['token-lib-fla-yes', 'token-lib-fla-no'],
        outcomePrices: ['0.42', '0.58'],
        outcomes: ['Yes', 'No'],
        endDate: '2026-11-30T23:59:59Z',
      },
      {
        id: 'm-libertadores-palmeiras-2026',
        groupItemTitle: 'Palmeiras',
        question: 'Will Palmeiras win Copa Libertadores 2026?',
        description: 'Copa Libertadores winner.',
        slug: 'palmeiras-libertadores-2026',
        active: true,
        closed: false,
        volume: 550000,
        clobTokenIds: ['token-lib-pal-yes', 'token-lib-pal-no'],
        outcomePrices: ['0.35', '0.65'],
        outcomes: ['Yes', 'No'],
        endDate: '2026-11-30T23:59:59Z',
      },
      {
        id: 'm-libertadores-river-2026',
        groupItemTitle: 'River Plate',
        question: 'Will River Plate win Copa Libertadores 2026?',
        description: 'Copa Libertadores winner.',
        slug: 'river-libertadores-2026',
        active: true,
        closed: false,
        volume: 350000,
        clobTokenIds: ['token-lib-riv-yes', 'token-lib-riv-no'],
        outcomePrices: ['0.23', '0.77'],
        outcomes: ['Yes', 'No'],
        endDate: '2026-11-30T23:59:59Z',
      },
    ],
  },
];

// ── Defensive Filtering: Discard Closed, Expired, and Resolved Markets ──
function filterOpenEvents(events: any[]): any[] {
  if (!Array.isArray(events)) return [];

  const now = Date.now();

  return events
    .filter((event) => {
      // 1. Explicit closed/active flags
      if (event.closed === true) return false;
      if (event.active === false) return false;
      if (event.resolved === true) return false;

      // 2. Resolution date has already passed
      if (event.endDate) {
        const endTimestamp = new Date(event.endDate).getTime();
        if (!isNaN(endTimestamp) && endTimestamp < now) {
          return false;
        }
      }

      return true;
    })
    .map((event) => {
      if (!Array.isArray(event.markets)) return event;

      const openMarkets = event.markets.filter((m: any) => {
        // 1. Explicit closed/active flags
        if (m.closed === true) return false;
        if (m.active === false) return false;
        if (m.resolved === true) return false;

        // 2. Resolution date has already passed
        const mEndDate = m.endDate || event.endDate;
        if (mEndDate) {
          const mTimestamp = new Date(mEndDate).getTime();
          if (!isNaN(mTimestamp) && mTimestamp < now) {
            return false;
          }
        }

        // 3. Fully resolved / settled prices (e.g. YES 0 / NO 1 or vice versa)
        let prices: number[] = [];
        const raw = m.outcomePrices;

        if (Array.isArray(raw)) {
          prices = raw.map((p: any) =>
            typeof p === 'number' ? p : parseFloat(String(p)),
          );
        } else if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              prices = parsed.map((p: any) =>
                typeof p === 'number' ? p : parseFloat(String(p)),
              );
            }
          } catch {}
        }

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
      });

      return { ...event, markets: openMarkets };
    })
    .filter((event) => {
      // Keep events that still have at least one genuinely open market
      return !Array.isArray(event.markets) || event.markets.length > 0;
    });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? '';
  const category = (searchParams.get('category')?.trim().toLowerCase() || 'trending') as string;
  const sort = (searchParams.get('sort')?.trim().toLowerCase() || 'volume') as string;
  const limit = 24;

  let rawData: any = null;

  try {
    if (query) {
      // ── Priority 1: Text search (decoupled from categories) ─────────
      try {
        const searchUrl = `${GAMMA_API_URL}/public-search?q=${encodeURIComponent(query)}`;
        const searchRes = await fetch(searchUrl, { headers: FETCH_HEADERS });

        if (searchRes.ok) {
          const searchJson = await searchRes.json();
          if (Array.isArray(searchJson?.events) && searchJson.events.length > 0) {
            rawData = searchJson.events;
          } else if (
            Array.isArray(searchJson?.markets) &&
            searchJson.markets.length > 0
          ) {
            rawData = searchJson.markets.map((m: Record<string, unknown>) => ({
              ...m,
              markets: [m],
            }));
          }
        }
      } catch (err) {
        console.warn('[API/Markets] /public-search attempt failed:', err);
      }

      // Fallback to /events?title= if public-search had no results
      if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
        try {
          const fallbackUrl = `${GAMMA_API_URL}/events?limit=${limit}&active=true&closed=false&title=${encodeURIComponent(query)}`;
          const fallbackRes = await fetch(fallbackUrl, { headers: FETCH_HEADERS });
          if (fallbackRes.ok) {
            const fallbackJson = await fallbackRes.json();
            if (Array.isArray(fallbackJson) && fallbackJson.length > 0) {
              rawData = fallbackJson;
            }
          }
        } catch (err) {
          console.warn('[API/Markets] /events fallback attempt failed:', err);
        }
      }
    } else {
      // ── Priority 2: Category browsing ──────────────────────────────
      if (category === 'latam') {
        // LatAm: Query across top Latin American keywords concurrently
        const latamKeywords = [
          'Colombia',
          'Brazil',
          'Mexico',
          'Argentina',
          'Venezuela',
          'Chile',
          'Milei',
          'Petro',
          'Lula',
        ];

        try {
          const fetchPromises = latamKeywords.map((kw) =>
            fetch(`${GAMMA_API_URL}/public-search?q=${encodeURIComponent(kw)}`, {
              headers: FETCH_HEADERS,
            })
              .then((res) => (res.ok ? res.json() : null))
              .catch(() => null)
          );

          const settled = await Promise.allSettled(fetchPromises);
          const collectedEvents: any[] = [];
          const seenEventIds = new Set<string>();

          for (const result of settled) {
            if (result.status === 'fulfilled' && result.value) {
              const resJson = result.value;
              const eventsList = Array.isArray(resJson?.events)
                ? resJson.events
                : Array.isArray(resJson?.markets)
                  ? resJson.markets.map((m: any) => ({ ...m, markets: [m] }))
                  : [];

              for (const ev of eventsList) {
                if (ev?.id && !seenEventIds.has(ev.id)) {
                  seenEventIds.add(ev.id);
                  collectedEvents.push(ev);
                }
              }
            }
          }

          if (collectedEvents.length > 0) {
            rawData = collectedEvents;
          }
        } catch (err) {
          console.warn('[API/Markets] LatAm concurrent search failed:', err);
        }
      } else if (category === 'soccer') {
        // Soccer: Query key tournaments, league tags, and tag_slug=soccer concurrently
        const soccerTerms = [
          'Champions League',
          'Premier League',
          'La Liga',
          'Serie A',
          'Bundesliga',
          'UCL',
          'UEL',
          'MLS',
          'Copa Libertadores',
        ];

        try {
          const fetchPromises = [
            fetch(
              `${GAMMA_API_URL}/events?limit=${limit}&active=true&closed=false&tag_slug=soccer`,
              { headers: FETCH_HEADERS },
            )
              .then((res) => (res.ok ? res.json() : null))
              .catch(() => null),
            ...soccerTerms.map((term) =>
              fetch(`${GAMMA_API_URL}/public-search?q=${encodeURIComponent(term)}`, {
                headers: FETCH_HEADERS,
              })
                .then((res) => (res.ok ? res.json() : null))
                .catch(() => null),
            ),
          ];

          const settled = await Promise.allSettled(fetchPromises);
          const collectedEvents: any[] = [];
          const seenEventIds = new Set<string>();

          for (const result of settled) {
            if (result.status === 'fulfilled' && result.value) {
              const resJson = result.value;
              const eventsList = Array.isArray(resJson)
                ? resJson
                : Array.isArray(resJson?.events)
                  ? resJson.events
                  : Array.isArray(resJson?.markets)
                    ? resJson.markets.map((m: any) => ({ ...m, markets: [m] }))
                    : [];

              for (const ev of eventsList) {
                if (ev?.id && !seenEventIds.has(ev.id)) {
                  seenEventIds.add(ev.id);
                  collectedEvents.push(ev);
                }
              }
            }
          }

          if (collectedEvents.length > 0) {
            rawData = collectedEvents;
          }
        } catch (err) {
          console.warn('[API/Markets] Soccer concurrent search failed:', err);
        }
      } else {
        // Standard categories (including 'all' and 'trending')
        let categoryUrl = `${GAMMA_API_URL}/events?limit=${limit}&active=true&closed=false`;

        if (sort === 'ending_soon' || category === 'ending-soon' || category === 'ending_soon') {
          const nowIso = new Date().toISOString();
          categoryUrl += `&order=endDate&ascending=true&end_date_min=${encodeURIComponent(nowIso)}`;
        } else if (sort === 'newest') {
          categoryUrl += '&order=startDate&ascending=false';
        } else if (category === 'trending') {
          categoryUrl += '&order=volume24hr&ascending=false';
        } else {
          categoryUrl += '&order=volume&ascending=false';
        }

        if (category === 'politics') {
          categoryUrl += '&tag_slug=politics';
        } else if (category === 'crypto') {
          categoryUrl += '&tag_slug=crypto';
        } else if (category === 'sports') {
          categoryUrl += '&tag_slug=sports';
        } else if (category === 'pop-culture') {
          categoryUrl += '&tag_slug=pop-culture';
        }
        // Note: When category === 'all', no tag_slug filter is applied, fetching across all topics

        try {
          const catRes = await fetch(categoryUrl, { headers: FETCH_HEADERS });
          if (catRes.ok) {
            const catJson = await catRes.json();
            if (Array.isArray(catJson) && catJson.length > 0) {
              rawData = catJson;
            } else if (Array.isArray(catJson?.events) && catJson.events.length > 0) {
              rawData = catJson.events;
            }
          }
        } catch (err) {
          console.warn(`[API/Markets] Category ${category} fetch failed:`, err);
        }
      }
    }

    // ── Apply Defensive Filtering: Discard Closed, Expired & Resolved ──
    let filteredData = filterOpenEvents(rawData);

    // Strictly enforce future end date when sorting by ending soon
    if (sort === 'ending_soon' || category === 'ending-soon' || category === 'ending_soon') {
      const now = Date.now();
      filteredData = filteredData.filter((event) => {
        const endStr = event.endDate || event.markets?.[0]?.endDate;
        if (!endStr) return false;
        const endTimestamp = new Date(endStr).getTime();
        return !isNaN(endTimestamp) && endTimestamp > now;
      });
    }

    // ── Graceful Fallback if Gamma is blocked by ISP / returned 0 ─────
    if (filteredData.length === 0) {
      if (query) {
        const qLower = query.toLowerCase();
        const matched = FALLBACK_EVENTS.filter(
          (e) =>
            e.title.toLowerCase().includes(qLower) ||
            e.description.toLowerCase().includes(qLower) ||
            e.markets.some(
              (m) =>
                m.question.toLowerCase().includes(qLower) ||
                m.description.toLowerCase().includes(qLower),
            ),
        );
        filteredData = filterOpenEvents(
          matched.length > 0 ? matched : FALLBACK_EVENTS.slice(0, 4),
        );
      } else {
        // Filter fallback by category
        const catEvents =
          category === 'all' || category === 'trending'
            ? FALLBACK_EVENTS
            : category === 'ending-soon' || category === 'ending_soon'
              ? FALLBACK_EVENTS.filter((e) => {
                  const endTime = new Date(e.endDate).getTime();
                  return !isNaN(endTime) && endTime > Date.now();
                })
              : FALLBACK_EVENTS.filter((e) => e.category === category);

        filteredData = filterOpenEvents(
          catEvents.length > 0 ? catEvents : FALLBACK_EVENTS,
        );
      }
    }

    // ── Apply Sorting to filteredData ─────────────────────────────────
    if (sort === 'ending_soon' || category === 'ending-soon' || category === 'ending_soon') {
      filteredData.sort((a, b) => {
        const dateA = new Date(a.endDate || a.markets?.[0]?.endDate || '9999-12-31').getTime();
        const dateB = new Date(b.endDate || b.markets?.[0]?.endDate || '9999-12-31').getTime();
        return dateA - dateB;
      });
    } else if (sort === 'newest') {
      filteredData.sort((a, b) => {
        const dateA = new Date(a.startDate || a.createdAt || a.endDate || 0).getTime();
        const dateB = new Date(b.startDate || b.createdAt || b.endDate || 0).getTime();
        return dateB - dateA;
      });
    } else {
      // Default: volume descending
      filteredData.sort((a, b) => {
        const volA =
          typeof a.volume === 'number' ? a.volume : parseFloat(String(a.volume)) || 0;
        const volB =
          typeof b.volume === 'number' ? b.volume : parseFloat(String(b.volume)) || 0;
        return volB - volA;
      });
    }

    console.log(
      '[API/Markets] Request:',
      query ? `query="${query}"` : `category="${category}"`,
      `sort="${sort}"`,
      'Active results count:',
      filteredData.length,
    );

    return NextResponse.json(filteredData);
  } catch (error) {
    console.error('[API/Markets] Unhandled error:', error);
    const fallbackFiltered = filterOpenEvents(
      category === 'all' || category === 'trending'
        ? FALLBACK_EVENTS
        : category === 'ending-soon' || category === 'ending_soon'
          ? FALLBACK_EVENTS.filter((e) => {
              const endTime = new Date(e.endDate).getTime();
              return !isNaN(endTime) && endTime > Date.now();
            })
          : FALLBACK_EVENTS.filter((e) => e.category === category) || FALLBACK_EVENTS,
    );

    if (sort === 'ending_soon' || category === 'ending-soon' || category === 'ending_soon') {
      fallbackFiltered.sort((a, b) => {
        const dateA = new Date(a.endDate || a.markets?.[0]?.endDate || '9999-12-31').getTime();
        const dateB = new Date(b.endDate || b.markets?.[0]?.endDate || '9999-12-31').getTime();
        return dateA - dateB;
      });
    } else if (sort === 'newest') {
      fallbackFiltered.sort((a, b) => {
        const dateA = new Date(a.startDate || a.createdAt || a.endDate || 0).getTime();
        const dateB = new Date(b.startDate || b.createdAt || b.endDate || 0).getTime();
        return dateB - dateA;
      });
    } else {
      fallbackFiltered.sort((a, b) => {
        const volA =
          typeof a.volume === 'number' ? a.volume : parseFloat(String(a.volume)) || 0;
        const volB =
          typeof b.volume === 'number' ? b.volume : parseFloat(String(b.volume)) || 0;
        return volB - volA;
      });
    }

    return NextResponse.json(fallbackFiltered);
  }
}
