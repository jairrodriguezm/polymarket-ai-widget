# 🌐 Polymarket AI Predictor & Paper Trading Terminal

> Institutional-grade prediction market terminal combining decentralized probability data, real-time multi-agent AI consensus, resilient multi-tier LLM fallback, and zero-risk paper trading execution. Built with Next.js 16 (Turbopack), TypeScript, Supabase, OpenAI, Gemini, and Tailwind CSS.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.0_App_Router-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![AI Engine](https://img.shields.io/badge/AI_Engine-OpenAI_%26_Gemini-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Tested_with-Vitest_%26_RTL-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 📹 Video Walkthrough & App Demo

[![Polymarket AI Predictor Widget Demo](https://cdn.loom.com/sessions/thumbnails/e55cff43f79b45089bf32b201e99a31b-4cc5d4ae848c9445.gif)](https://www.loom.com/share/e55cff43f79b45089bf32b201e99a31b)

> 📺 **[Watch the Full Video Walkthrough on Loom (10 min)](https://www.loom.com/share/e55cff43f79b45089bf32b201e99a31b)**  
> A complete architectural and operational explanation of the application: live market discovery, real-time 3-agent deliberation committee (Resolution Auditor, News Hunter via Tavily RAG, and Risk & Value Arbiter), paper trading order execution, reactive virtual balance tracking, and mobile responsiveness.

---

## ⚡ Executive Summary

Prediction markets reflect real-world probabilities through financial consensus, but retail traders often encounter two major barriers:

1. **Information Asymmetry:** Breaking developments outpace manual research, leaving users at a disadvantage against automated participants.
2. **Capital Risk on Incomplete Data:** Testing thesis execution requires real capital, raising the barrier to entry.
3. **AI Infrastructure Fragility:** Single-model AI agents fail when rate limits, regional restrictions, or quota limits hit.

**Polymarket AI Predictor** solves all three. It continuously pulls live event order-book data from Polymarket's Gamma API, passes contextual market rules through a **3-Agent AI Deliberation Committee** with an autonomous **Multi-Tier Fallback Pipeline** (OpenAI `gpt-4o-mini` → Google Gemini `gemini-2.0-flash` → Statistical Algorithmic Consensus), and allows users to simulate positions in a dedicated **Paper Trading Execution Slip** with persistent virtual balances and portfolio tracking.

---

## 🏛️ System Architecture

```mermaid
graph TD
  subgraph Client ["Client Presentation Tier (Next.js 16 App Router)"]
    UI["UI Components / Tailwind CSS"]
    Feed["Market Discovery & Custom Sort Dropdown"]
    Committee["AI Deliberation Panel (3 Agents + Live Statuses)"]
    Slip["Execution Slip (Dynamic Math & Outcomes)"]
    PortfolioModal["Portfolio & Bet History Modal"]
    BalanceHook["Unified Balance & Realtime Sync"]
  end

  subgraph Edge ["Serverless Edge Handlers"]
    APIMarkets["/api/markets (Cache & Aggregation)"]
    APIAnalyze["/api/analyze-market (Multi-Tier Deliberation Engine)"]
    RateLimiter["In-Memory Rate Limiter (30s Cooldown + Dev Bypass)"]
  end

  subgraph AIWaterfall ["Multi-Tier Deliberation Waterfall"]
    Tavily["Tavily Search API (Resilient Live News RAG)"]
    Tier1["Tier 1: OpenAI gpt-4o-mini (JSON Mode Primary)"]
    Tier2["Tier 2: Google Gemini 2.0 (Secondary Failover)"]
    Tier3["Tier 3: Algorithmic Consensus (+EV Order-Book Math)"]
  end

  subgraph Persistence ["Persistence Layer (Supabase PostgreSQL)"]
    DB[(PostgreSQL 15+)]
    ProfilesTable["public.profiles (Virtual Balances)"]
    BetsTable["public.bets (Dynamic Outcome Orders)"]
  end

  UI --> Feed
  Feed --> Committee
  Committee --> Slip
  Slip --> PortfolioModal
  Feed -->|Fetch Active Markets| APIMarkets
  Committee -->|Trigger Deliberation| RateLimiter
  RateLimiter --> APIAnalyze
  APIAnalyze -->|Context Retrieval| Tavily
  APIAnalyze -->|Primary Synthesis| Tier1
  Tier1 -.->|Failover on Limit/Error| Tier2
  Tier2 -.->|Failover on Exhaustion| Tier3
  Slip -->|Insert Trade| BetsTable
  Slip -->|Atomic Balance Deduction| ProfilesTable
  ProfilesTable -.->|Reactive Sync| BalanceHook
  BalanceHook --> UI
```

---

## 🔄 End-to-End Execution Sequence

```mermaid
sequenceDiagram
  autonumber
  actor Trader as User / Analyst
  participant Client as Web App (Client)
  participant API as Next.js Route Handlers
  participant Rate as Cooldown Limiter
  participant Tavily as Tavily Search (RAG)
  participant AI as Multi-Tier AI Engine
  participant DB as Supabase (PostgreSQL)

  Trader->>Client: Selects market card and filters by sort criteria
  Client->>API: GET /api/markets?sort=volume
  API-->>Client: Normalized entities (parsed outcomes and prices)

  Trader->>Client: Opens Market Detail
  Client->>API: POST /api/analyze-market (title, outcomes, prices)
  API->>Rate: Verify cooldown (30s window - bypassed in development)
  Note over Client: Deliberation: Auditor to News to Arbiter
  API->>Tavily: Search live news (quota limits handled gracefully)
  
  alt Tier 1: OpenAI Available
    API->>AI: OpenAI gpt-4o-mini (JSON Mode)
    AI-->>API: Committee Consensus and Agent Votes
  else Tier 2: OpenAI Quota or Rate Error
    API->>AI: Gemini 2.0 Flash Failover
    AI-->>API: Committee Consensus and Agent Votes
  else Tier 3: Total External Provider Failure
    API->>AI: Statistical Algorithmic Consensus (+EV Spread)
    AI-->>API: Guaranteed Mathematical Consensus
  end

  API-->>Client: Return normalized consensus, agent votes, tier badge
  Client->>Client: Render live agent roster with status tooltips

  Trader->>Client: Clicks "Apply Consensus to Bet Slip"
  Client->>Client: Auto-selects outcome tab and recalculates payout
  Trader->>Client: Inputs stake ($85.00 USDC) and submits order
  Client->>DB: INSERT into bets and UPDATE profiles virtual_balance
  DB-->>Client: Commit confirmed (Balance: $1000.00 to $915.00)
  Client->>Client: Updates balance chip and unlocks My Portfolio entry
```

---

## 🔬 Core Engineering Highlights

### 1. Resilient Multi-Tier AI Deliberation Engine
To guarantee institutional uptime and zero downtime during high-traffic prediction events:
- **Tier 1 (Primary - OpenAI `gpt-4o-mini`):** Leverages strict JSON mode (`response_format: { type: 'json_object' }`) and low temperature (`0.3`) for deterministic structured committee deliberation.
- **Tier 2 (Secondary Failover - Google Gemini `gemini-2.0-flash`):** Automatically takes over if OpenAI encounters rate limits, timeouts, or quota exhaustion.
- **Tier 3 (Ultimate Failover - Statistical Algorithmic Consensus):** Calculates objective expected value (+EV), implied odds, and spread distribution directly from order-book data and available news signals. **Zero failure rate and 100% availability**.
- **Standard Committee Schema:** Every tier outputs an identical contract schema:
  ```json
  {
    "consensus": {
      "recommendedOutcome": "string",
      "conviction": 85,
      "rationale": "2-3 sentence synthesized justification"
    },
    "agents": [
      { "name": "Resolution Auditor", "role": "Rules & Criteria", "vote": "string", "confidence": "85%", "status": "string" },
      { "name": "Sentiment & News Hunter", "role": "Live News & Signals", "vote": "string", "confidence": "82%", "status": "string" },
      { "name": "Risk & Value Arbiter", "role": "Quantitative Edge", "vote": "string", "confidence": "88%", "status": "string" }
    ]
  }
  ```
- **Backwards Compatibility:** Returns root-level convenience fields (`recommendedOutcome`, `confidence`, `rationale`, `recommendedBetSize`, `tier`) ensuring seamless compatibility across all client components.

### 2. Live Agent Deliberation Roster & Status Tooltips
- **Auditor, News Hunter & Value Arbiter:** Each agent renders its real-time vote, confidence percentage, and contract status.
- **Interactive Tooltips:** Native HTML title tooltips allow analysts to inspect specific deliberation notes (e.g. *"Contract resolution parameters verified"* or *"+EV margin of safety confirmed"*).
- **Engine Tier Badge:** Displays the active engine tier directly in the header (`GPT-4o mini`, `Gemini 2.0`, or `Algorithmic`).

### 3. Disentangled Rate Limiting & RAG Handling
- **Millisecond Cooldown Math:** 30-second sliding rate window per client IP/session with automatic cache purging to prevent memory leaks on serverless infrastructure.
- **Development Bypass:** When `process.env.NODE_ENV === 'development'`, rate limits are bypassed so development and testing are never blocked.
- **Resilient Tavily Ingestion:** If Tavily reaches monthly search quota (HTTP 429), it degrades gracefully without aborting the deliberation pipeline.

### 4. Resilient Polymarket Data Normalization
Polymarket's Gamma API delivers polymorphic data structures: outcomes and outcomePrices often arrive as stringified JSON arrays (e.g. `'["Yes", "No"]'`) or custom multi-choice options (`'["Over 2.5", "Under 2.5"]'`).
- **Defensive Parsing:** An edge sanitization utility parses nested stringified payloads with fallback guarantees.
- **Dynamic Contract Adaptation:** Completely moves away from binary assumptions. Labels, order slip tabs, and database records adapt dynamically to the market's real outcome terms.
- **Semantic Palette Assignment:** Programmatically assigns affirmative/first-position choices to emerald tokens and opposing/secondary choices to rose tokens.

### 5. Unified Balance State & Portfolio Ledger
- **Atomic Balance Management:** Synchronized state across navigation indicators, slip validation, and Supabase ledger entries.
- **Dynamic Database Constraints:** Database schema permits arbitrary dynamic outcome labels safely via `CHECK (length(trim(outcome)) > 0)`.
- **My Portfolio Modal:** Real-time ledger view allowing traders to track position sizes, entry prices, potential returns, and historical timestamps.

### 6. Apple-Grade Human Interface Engineering
- **Desktop vs. Mobile Viewport Isolation:** Two-column sticky split on desktop transitions into an accessible slide-over drawer on mobile, utilizing guarded `document.body.style.overflow` locking that never hijacks desktop scroll behavior.
- **Custom Sort Popover:** Replaced default browser select tags with an accessible, keyboard-navigable popover dropdown supporting **Volume**, **Ending Soon** (filtering out expired events), and **Newest**.
- **Floating Quick-Actions:** A throttled, smooth-scrolling "Back to Top" pill docked cleanly inside the content column.

---

## 🛠️ Architecture & Engineering Trade-offs

| Decision Point | Choice Made | Alternative Considered | Engineering Rationale |
| :--- | :--- | :--- | :--- |
| **AI Deliberation Engine** | 3-Tier Fallback (OpenAI → Gemini → Algorithmic) | Single LLM Provider | Completely eliminates terminal downtime caused by API quota exhaustion, upstream rate limits, or regional outages. |
| **Data Fetching Layer** | Next.js Server Handlers (`/api/*`) | Client-side direct fetching | Hides sensitive API keys (OpenAI/Gemini/Tavily), enables server-side response caching, and prevents CORS and payload bloat on mobile clients. |
| **Testing Framework** | Vitest + React Testing Library | Jest | Native ESM and TypeScript support with shared Vite configuration, achieving sub-second test runs without complex Babel transpilation. |
| **AI Context Ingestion** | Tavily API with 429 Graceful Degradation | Direct Web Scraping | Extracts clean markdown content directly for LLM consumption without anti-bot blocks or token-heavy HTML clutter. |
| **Outcome Model** | Dynamic String Arrays | Binary Boolean Flags (`isYes`) | Supports real-world categorical markets (e.g., elections, over/under spreads) without breaking data contracts or database constraints. |
| **State Persistence** | Supabase Postgres + Realtime | LocalStorage / In-Memory State | Provides true cross-device session persistence, transactional balance integrity, and audit-ready paper trading records. |

---

## 🧪 Comprehensive Test Suite

The test suite is built on **Vitest** and **React Testing Library**, prioritizing numerical precision, data resilience, and defensive UI states:

```bash
# Run test suite
npm run test

# Run tests in watch mode
npm run test:watch
```

### Tested Modules
- **[`tests/unit/betMath.test.ts`](tests/unit/betMath.test.ts):** Validates share derivation ($Amount / Price), $1.00 USDC terminal payout resolutions, percentage ROI calculations, and edge cases (zero/negative amounts, pricing boundaries).
- **[`tests/unit/polymarketNormalize.test.ts`](tests/unit/polymarketNormalize.test.ts):** Verifies JSON-stringified outcome parsing, corrupt payload fallbacks, and multi-condition market sorting (`ending_soon` temporal filtering).
- **[`tests/components/BetSlip.test.tsx`](tests/components/BetSlip.test.tsx):** Asserts reactive outcome badge styling, dynamic label injections, and balance-defensive disabled states.

---

## 🗄️ Database Schema (Supabase PostgreSQL)

```sql
-- Profiles table for user balances
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text default 'Demo Trader',
  virtual_balance numeric(12, 2) default 1000.00 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bets table supporting dynamic multi-outcome positions
create table public.bets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  market_id text not null,
  market_question text not null,
  outcome text not null,
  amount numeric(10, 2) not null check (amount > 0),
  price numeric(4, 2) not null check (price > 0 and price <= 1.00),
  shares numeric(12, 2) not null check (shares > 0),
  potential_payout numeric(12, 2) not null,
  status text default 'OPEN' check (status in ('OPEN', 'WON', 'LOST', 'REFUNDED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint bets_outcome_check check (length(trim(outcome)) > 0)
);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.bets enable row level security;

create policy "Public read profiles" on public.profiles for select using (true);
create policy "Users update own balance" on public.profiles for update using (true);
create policy "Public read bets" on public.bets for select using (true);
create policy "Public insert bets" on public.bets for insert with check (true);
```

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/polymarket-ai-widget.git
cd polymarket-ai-widget
npm install --legacy-peer-deps
```

### 2. Environment Variables Setup
Create `.env.local` in the project root:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Single Source of Truth Demo Profile
NEXT_PUBLIC_DEMO_USER_ID=f07d5b04-96ab-4fd7-97ad-fc1056644be1

# AI Intelligence & Retrieval Engines
OPENAI_API_KEY=your-openai-api-key             # Tier 1 Deliberation (gpt-4o-mini)
GEMINI_API_KEY=your-google-gemini-api-key       # Tier 2 Deliberation (gemini-2.0-flash)
TAVILY_API_KEY=your-tavily-api-key             # Real-time News Ingestion (RAG)

# Public Polymarket Endpoints
NEXT_PUBLIC_POLYMARKET_API_URL=https://gamma-api.polymarket.com
```

### 3. Build & Verify
```bash
# Run unit tests (Vitest + React Testing Library)
npm run test

# Verify type integrity and Next.js production build
npm run build

# Launch development server
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) to interact with the terminal.
