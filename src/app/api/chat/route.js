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
- A TradingView chart automatically appears next to the chat when you mention a $TICKER. NEVER say "I can't display charts" or "I can't show live data" — the chart widget handles that. Just give your analysis and mention the $TICKER so the chart loads. If the user asks for a specific timeframe (1m, 5m, daily, etc.), the chart will match it automatically.
- Always mention the $TICKER format so the chart sidebar activates (e.g. $TSLA, $NVDA).
- When asked about rates/Fed/macro, discuss current policy, rate outlook, treasury yields, inflation data.
- When asked about sports, give real info — standings, playoff pictures, recent results, key matchups, trades. Cover NFL, NBA, NHL, MLB, soccer, UFC, whatever is relevant.
- Be opinionated. Jeff wants real takes, not disclaimers.
- Keep responses punchy and scannable with bullet points.

## ARTIFACTS (CRITICAL — always include this):
At the END of every response, you MUST include a hidden artifacts tag that tells the UI what to display in the side panel. Format:
<!--artifacts:JSON-->

The JSON must have a "type" field and relevant data. Types:

1. **stock** — when discussing stocks/crypto. Include ticker and optional timeframe.
   <!--artifacts:{"type":"stock","ticker":"AAPL","interval":"60"}-->

2. **scores** — ONLY when the user asks about live games, scores, standings, or "what's on tonight"
   <!--artifacts:{"type":"scores","sport":"nba"}-->

3. **search** — for ANYTHING else that would benefit from visual links: collectibles, products, people, places, news topics, how-tos, etc. Provide 4-8 relevant clickable links with labels, URLs, and optional emoji icons.
   <!--artifacts:{"type":"search","title":"LeBron James NBA Cards","links":[{"label":"eBay: LeBron Rookie Cards","url":"https://www.ebay.com/sch/i.html?_nkw=lebron+james+rookie+card","icon":"🛒"},{"label":"PSA Pop Report","url":"https://www.psacard.com/pop","icon":"📊"}]}-->

4. **none** — when the response is purely conversational and no side panel adds value
   <!--artifacts:{"type":"none"}-->

RULES:
- ALWAYS include exactly ONE artifacts tag at the very end of your response
- Choose the type that BEST matches what the user is asking about — not just keyword matching
- "LeBron James NBA cards" → type "search" with card marketplace links, NOT "scores"
- "NBA scores tonight" → type "scores"
- "How is TSLA doing" → type "stock"
- "Best restaurants in Boston" → type "search" with Google Maps, Yelp links
- "What's the weather like" → type "search" with weather links
- For "search" type, make the links ACTUALLY RELEVANT to the specific question. Use real URLs.
- The artifacts tag is stripped before display — the user never sees it`;

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
