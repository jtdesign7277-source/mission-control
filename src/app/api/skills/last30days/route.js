import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

export async function POST(request) {
  try {
    const { topic } = await request.json();
    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Missing topic' }, { status: 400 });
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a research agent. When given a topic, provide a comprehensive "last 30 days" analysis covering:

1. **Reddit** — Top discussions, upvoted posts, community sentiment
2. **X/Twitter** — Trending takes, viral posts, key voices
3. **YouTube** — Popular recent videos, creators covering this
4. **Web/News** — Recent articles, developments, announcements

Format your response clearly with sections. Include:
- Key findings and trends
- Notable quotes or posts (paraphrased)
- Sentiment summary (bullish/bearish/mixed/excited/skeptical)
- Actionable insights or opportunities

Be specific with names, numbers, and dates when possible. Write in a direct, no-fluff style. Focus on what's actually being discussed in the last 30 days, not general background info.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Research this topic across Reddit, X/Twitter, YouTube, and the web from the last 30 days: "${topic}"`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Claude API error:', err);
      return NextResponse.json(
        { error: 'Claude API request failed' },
        { status: 502 }
      );
    }

    const data = await res.json();
    const output = data.content?.[0]?.text || 'No response from Claude';

    return NextResponse.json(
      { topic, output },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err) {
    console.error('Skills last30days error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
