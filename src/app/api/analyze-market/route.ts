import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import type { AnalyzeMarketRequest, AIRecommendation } from '@/types';

// In-memory rate limiting map: clientKey -> timestamp (ms)
const rateLimitMap = new Map<string, number>();
const COOLDOWN_MS = 30 * 1000; // 30 seconds in ms

export async function POST(request: Request) {
  try {
    const body: AnalyzeMarketRequest = await request.json();
    const { marketTitle, description } = body;

    if (!marketTitle) {
      return NextResponse.json(
        { error: 'marketTitle is required' },
        { status: 400 },
      );
    }

    // ── 1. Custom Cooldown Rate Limiter ─────────────────────────────────
    const isDev = process.env.NODE_ENV === 'development';
    const forwardedHeader =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('cf-connecting-ip') ||
      'demo-user';
    const clientKey = forwardedHeader.split(',')[0].trim();

    if (!isDev) {
      const now = Date.now();
      const lastRequestTimestamp = rateLimitMap.get(clientKey);

      if (lastRequestTimestamp) {
        const timeSinceLast = now - lastRequestTimestamp;
        if (timeSinceLast < COOLDOWN_MS) {
          const remainingSec = Math.ceil((COOLDOWN_MS - timeSinceLast) / 1000);
          return NextResponse.json(
            {
              error: `Please wait ${remainingSec}s before requesting another analysis.`,
            },
            { status: 429 },
          );
        }
      }

      // Purge entries older than 2x cooldown to prevent memory leaks on serverless
      for (const [key, ts] of rateLimitMap.entries()) {
        if (now - ts > COOLDOWN_MS * 2) {
          rateLimitMap.delete(key);
        }
      }

      // Set timestamp for current client request
      rateLimitMap.set(clientKey, now);
    }

    // ── 2. Tavily News Retrieval (Disentangled & Resilient) ─────────────
    let newsContext = 'No recent news found.';
    const tavilyApiKey = process.env.TAVILY_API_KEY;

    if (tavilyApiKey) {
      try {
        const tavilyRes = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: tavilyApiKey,
            query: marketTitle,
            max_results: 3,
            topic: 'news',
            search_depth: 'basic',
          }),
        });

        if (tavilyRes.status === 429) {
          console.error('[API Error] Tavily monthly credit quota exceeded (429).');
          newsContext = 'Recent news context unavailable due to search quota limits.';
        } else if (!tavilyRes.ok) {
          const errorBody = await tavilyRes.text().catch(() => '');
          console.warn(
            `[API Warning] Tavily search returned HTTP ${tavilyRes.status}, continuing with base analysis:`,
            errorBody,
          );
          newsContext = 'Recent news context currently unavailable.';
        } else {
          const tavilyData = await tavilyRes.json();
          if (tavilyData?.results && Array.isArray(tavilyData.results) && tavilyData.results.length > 0) {
            newsContext = tavilyData.results
              .map(
                (r: any, i: number) =>
                  `[Article ${i + 1}] "${r.title || 'Untitled'}"\nSource: ${r.url || 'Web'}\nSummary: ${r.content || ''}`,
              )
              .join('\n\n');
          }
        }
      } catch (err) {
        console.warn(
          '[API Warning] Tavily fetch error, continuing with base analysis:',
          err,
        );
        newsContext = 'Recent news context currently unavailable.';
      }
    }

    // ── 3. Gemini Deliberation Call (Disentangled Error Handling) ────────
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured.' },
        { status: 500 },
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a financial analysis committee of three experts: a Political Analyst, a Quantitative Trader, and a Risk Manager.

You are analyzing the following prediction market:

**Market Title:** ${marketTitle}
**Description:** ${description || 'No additional description provided.'}

**Latest News Context:**
${newsContext}

Each expert must provide their individual assessment. Then, as a committee, reach a final consensus recommendation.

Consider:
- Current probability implied by the market
- Recent news sentiment and factual developments
- Historical precedents for similar events
- Time remaining until resolution
- Key risk factors and uncertainties

Provide your consensus recommendation as structured JSON.`;

    const modelConfig = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendedOutcome: {
            type: Type.STRING,
            description: 'The recommended outcome: YES or NO',
            enum: ['YES', 'NO'],
          },
          confidence: {
            type: Type.NUMBER,
            description: 'Confidence level from 0 to 100 as a percentage',
          },
          rationale: {
            type: Type.STRING,
            description:
              'A detailed 2-4 sentence rationale explaining the committee consensus, referencing the news context when available',
          },
          recommendedBetSize: {
            type: Type.NUMBER,
            description:
              'Recommended bet size in USDC (1-100), proportional to confidence.',
          },
        },
        required: [
          'recommendedOutcome',
          'confidence',
          'rationale',
          'recommendedBetSize',
        ],
      },
    };

    let responseText: string | undefined;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: modelConfig,
      });
      responseText = response.text;
    } catch (err: any) {
      console.error('[API Error] Gemini call failed:', err);
      const errMsg = String(err?.message || err || '');
      const errStatus = err?.status || err?.code;

      // Quota exhaustion from provider
      if (
        errStatus === 429 ||
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.toLowerCase().includes('quota')
      ) {
        return NextResponse.json(
          {
            error:
              'AI analysis quota temporarily exhausted by provider. Please try again shortly.',
          },
          { status: 429 },
        );
      }

      // VPN / Regional restriction
      if (
        errStatus === 400 &&
        (errMsg.toLowerCase().includes('location') ||
          errMsg.toLowerCase().includes('unsupported') ||
          errMsg.toLowerCase().includes('region') ||
          errMsg.toLowerCase().includes('country'))
      ) {
        return NextResponse.json(
          {
            error:
              'VPN Location unsupported by AI provider. Switch VPN to Canada, Mexico, or US.',
          },
          { status: 400 },
        );
      }

      // High demand on provider infrastructure
      if (
        errStatus === 503 ||
        errMsg.includes('503') ||
        errMsg.toLowerCase().includes('high demand')
      ) {
        return NextResponse.json(
          {
            error:
              'AI service is currently experiencing high demand. Please try again in a few moments.',
          },
          { status: 503 },
        );
      }

      return NextResponse.json(
        { error: err?.message || 'Failed to generate AI analysis' },
        { status: 500 },
      );
    }

    if (!responseText) {
      return NextResponse.json(
        { error: 'Gemini returned an empty response. Please try again.' },
        { status: 502 },
      );
    }

    const recommendation: AIRecommendation = JSON.parse(responseText);

    // Clamp values to valid ranges
    recommendation.confidence = Math.min(
      100,
      Math.max(0, recommendation.confidence),
    );
    recommendation.recommendedBetSize = Math.min(
      100,
      Math.max(1, recommendation.recommendedBetSize),
    );

    return NextResponse.json(recommendation);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[AnalyzeMarket] Unhandled route error:', message);

    return NextResponse.json(
      {
        error: 'Failed to analyze market',
        details: message,
      },
      { status: 500 },
    );
  }
}
