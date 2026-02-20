import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min timeout for long research

const OPENCLAW_BASE = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:4152';
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '';

export async function POST(request) {
  try {
    const { topic } = await request.json();
    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Missing topic' }, { status: 400 });
    }

    // Send to OpenClaw as a spawned sub-agent task
    const res = await fetch(`${OPENCLAW_BASE}/api/sessions/spawn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(OPENCLAW_TOKEN ? { 'Authorization': `Bearer ${OPENCLAW_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        task: `Run the last30days skill to research the topic: "${topic}". Use the skill at ~/.claude/skills/last30days. Search Reddit, X/Twitter, YouTube, and the web for what people are saying about this topic in the last 30 days. Return a comprehensive summary with key findings, top posts, trending discussions, and any useful prompts or insights.`,
        label: `last30days: ${topic}`,
        timeoutSeconds: 300,
      }),
    });

    if (!res.ok) {
      // Fallback: return instructions to run manually
      return NextResponse.json({
        topic,
        output: `⚠️ Could not connect to OpenClaw gateway to run the skill automatically.\n\nTo run manually, open a terminal and run:\n\ncd ~/.claude/skills/last30days && python3 scripts/research.py "${topic}"\n\nOr ask Fred in chat: "Run last30days on ${topic}"`,
        fallback: true,
      }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
    }

    const data = await res.json();

    return NextResponse.json({
      topic,
      output: data.result || data.output || data.message || 'Research task spawned. Check back in a few minutes.',
      sessionKey: data.sessionKey,
      runId: data.runId,
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
