import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { tavily } from '@tavily/core';
import type { AnalyzeMarketRequest, AIRecommendation } from '@/types';

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

    // ── Step 1: RAG — Fetch latest news via Tavily ──────────────────────
    let newsContext = 'No recent news found.';
    if (process.env.TAVILY_API_KEY) {
      try {
        const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });
        const searchResult = await tavilyClient.search(marketTitle, {
          maxResults: 3,
          topic: 'news',
          searchDepth: 'basic',
        });

        if (searchResult?.results && searchResult.results.length > 0) {
          newsContext = searchResult.results
            .map(
              (r, i) =>
                `[Article ${i + 1}] "${r.title}"\nSource: ${r.url}\nSummary: ${r.content}`,
            )
            .join('\n\n');
        }
      } catch (tavilyError) {
        console.warn('[AnalyzeMarket] Tavily search skipped or failed:', tavilyError);
      }
    }

    // ── Step 2: Multi-Agent Consensus via Gemini ────────────────────────
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

    // Robust Gemini call with model fallback
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: modelConfig,
      });
      responseText = response.text;
    } catch (geminiError: any) {
      const errMsg = String(geminiError?.message || geminiError || '');
      const errStatus = geminiError?.status || geminiError?.code;

      console.error('[AnalyzeMarket] Gemini error caught:', {
        status: errStatus,
        message: errMsg,
      });

      // 429 or quota exhaustion
      if (
        errStatus === 429 ||
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.toLowerCase().includes('quota') ||
        errMsg.toLowerCase().includes('rate limit')
      ) {
        return NextResponse.json(
          {
            error:
              'Rate limit reached. Please wait 30 seconds before requesting another analysis.',
          },
          { status: 429 },
        );
      }

      // 400 location / unsupported region
      if (
        errStatus === 400 &&
        (errMsg.toLowerCase().includes('location') ||
          errMsg.toLowerCase().includes('unsupported') ||
          errMsg.toLowerCase().includes('country') ||
          errMsg.toLowerCase().includes('region'))
      ) {
        return NextResponse.json(
          {
            error:
              'VPN Location unsupported by AI provider. Switch VPN to Canada or Mexico.',
          },
          { status: 400 },
        );
      }

      // 503 high demand
      if (errStatus === 503 || errMsg.includes('503') || errMsg.toLowerCase().includes('high demand')) {
        return NextResponse.json(
          {
            error:
              'AI service is currently experiencing high demand. Please try again in a few moments.',
          },
          { status: 503 },
        );
      }

      // Try gemini-2.5-flash as fallback if 3.6 failed for another reason
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: modelConfig,
        });
        responseText = fallbackResponse.text;
      } catch (fallbackError: any) {
        const fbMsg = String(fallbackError?.message || '');
        if (
          fbMsg.includes('429') ||
          fbMsg.includes('RESOURCE_EXHAUSTED') ||
          fbMsg.toLowerCase().includes('quota')
        ) {
          return NextResponse.json(
            {
              error:
                'Rate limit reached. Please wait 30 seconds before requesting another analysis.',
            },
            { status: 429 },
          );
        }
        throw geminiError; // Re-throw original error to hit outer handler
      }
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
    console.error('[AnalyzeMarket] Route error handler:', message);

    if (
      message.includes('429') ||
      message.includes('RESOURCE_EXHAUSTED') ||
      message.toLowerCase().includes('quota') ||
      message.toLowerCase().includes('rate limit')
    ) {
      return NextResponse.json(
        {
          error:
            'Rate limit reached. Please wait 30 seconds before requesting another analysis.',
        },
        { status: 429 },
      );
    }

    if (
      message.toLowerCase().includes('location') ||
      message.toLowerCase().includes('unsupported')
    ) {
      return NextResponse.json(
        {
          error:
            'VPN Location unsupported by AI provider. Switch VPN to Canada or Mexico.',
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to analyze market',
        details: message,
      },
      { status: 500 },
    );
  }
}
