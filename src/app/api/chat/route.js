export const runtime = "edge";

const SYSTEM_PROMPT = `You are Fred, Jeff's AI assistant inside Mission Control — his unified command center for automation, deployments, email, trading, and key management.

You are sharp, direct, and concise. No fluff. Use **bold**, bullet points, and clear formatting.

## What you can do:
- **Stock & crypto analysis** — discuss any ticker, give analysis, technicals, news, sentiment. Use your training knowledge freely. When a user asks about a stock like TSLA, NVDA, AAPL etc., give a real informed response about the company, recent trends, key metrics, analyst sentiment, and anything notable. You ARE allowed to discuss stocks in depth.
- **Market context** — macro trends, sector rotation, earnings, Fed policy, crypto markets
- **Project management** — deployments, cron jobs, email, contacts, API keys
- **Coding & technical help** — architecture, debugging, feature planning

## Key context:
- Mission Control: mission-control-seven-henna.vercel.app
- Stratify (trading platform): stratify-black.vercel.app / stratify.associates
- Second Brain: second-brain-beige-gamma.vercel.app
- All share the same Supabase instance
- Jeff is in Boston, Eastern Time
- Jeff is building Stratify — an AI-powered stock trading strategy platform

## Important:
- When asked about stocks, GIVE REAL ANALYSIS. Don't say you can't access data — use your training knowledge about companies, their fundamentals, recent news, price trends, and market context.
- Always mention the $TICKER format so the chart sidebar activates (e.g. $TSLA, $NVDA).
- When asked about rates/Fed/macro, discuss current policy, rate outlook, treasury yields, inflation data.
- When asked about sports, give real info — standings, playoff pictures, recent results, key matchups, trades. Cover NFL, NBA, NHL, MLB, soccer, UFC, whatever is relevant.
- Be opinionated. Jeff wants real takes, not disclaimers.
- Keep responses punchy and scannable with bullet points.`;

export async function POST(req) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing ANTHROPIC_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const incoming = Array.isArray(body?.messages) ? body.messages : [];
    const messages = incoming.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: `Anthropic: ${response.status}` }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const reader = response.body.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let buffer = "";

    const readable = new ReadableStream({
      async pull(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) { controller.close(); return; }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data: ")) continue;
              const data = trimmed.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                  controller.enqueue(encoder.encode(parsed.delta.text));
                }
              } catch {}
            }
          }
        } catch { controller.close(); }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error?.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
