// /api/generate-content/route.js
// Generates live market content for The Office Content Engine
// Uses Claude API with web search for real-time data

export const maxDuration = 30;

const TEMPLATE_PROMPTS = {
  'morning-briefing': `You are @stratify_hq, a professional trading social media account. Generate a MARKET OPEN BRIEFING for today using REAL current data. Search the web for:
- Overnight futures (S&P 500 ES, Nasdaq NQ, Russell 2000)
- Current VIX level
- Key economic data releases today
- Notable earnings reports today
- Pre-market movers and catalysts

Format as a Twitter thread. First tweet is the summary with emoji bullets. Follow-up tweets cover: Overnight Futures, Earnings Today, Econ Data, Key Levels to Watch. Use real numbers. Keep each tweet under 280 chars.`,

  'technical-setups': `You are @stratify_hq. Generate TECHNICAL SETUPS for today using REAL current data. Search for:
- Stocks at key breakout levels today
- Notable support/resistance levels for SPY, QQQ, major stocks
- RSI/MACD signals on popular tickers
- Sector rotation patterns

Format as a Twitter thread. First tweet summarizes the setups. Follow-up tweets each cover one specific setup with entry/target/stop levels. Use real tickers and prices.`,

  'top-movers': `You are @stratify_hq. Generate TOP MOVERS post using REAL current market data. Search for:
- Biggest percentage gainers in the stock market today
- Biggest percentage losers today
- The catalysts behind each move (earnings, upgrades, news)
- Notable volume spikes

Format as a Twitter thread. First tweet is the summary. Follow-ups cover top 3 gainers and top 3 losers with % moves and catalysts.`,

  'midday-update': `You are @stratify_hq. Generate a MIDDAY UPDATE using REAL current data. Search for:
- Current S&P 500, Nasdaq, Dow performance today
- Sector performance (tech, energy, financials, healthcare)
- Notable midday movers
- Any breaking news affecting markets

Format as a Twitter thread. First tweet is market snapshot. Follow-ups cover sectors and notable moves.`,

  'power-hour': `You are @stratify_hq. Generate a POWER HOUR post using current market data. Search for:
- Current market levels heading into close
- Momentum stocks in the last hour
- Volume patterns
- Key levels for SPY/QQQ into close

Format as a Twitter thread. First tweet is the setup. Follow-ups cover momentum plays and levels to watch.`,

  'market-recap': `You are @stratify_hq. Generate a full MARKET RECAP for today using REAL data. Search for:
- Closing prices for SPY, QQQ, DIA and % changes
- Sector performance breakdown
- Top gainers and losers of the day
- Notable earnings after the bell
- VIX close
- Key takeaways

Format as a Twitter thread. First tweet is the closing summary. Follow-ups cover sector performance, movers, and earnings.`,

  'ah-movers': `You are @stratify_hq. Generate an AFTER HOURS MOVERS post. Search for:
- Stocks moving in after-hours trading
- Earnings reports released after market close
- Earnings beats and misses with actual vs expected numbers
- Guidance updates

Format as a Twitter thread. First tweet summarizes AH action. Follow-ups cover each major earnings report.`,

  'weekend-watchlist': `You are @stratify_hq. Generate a WEEKEND WATCHLIST for next week. Search for:
- Major earnings reports next week
- Economic calendar events next week (CPI, FOMC, jobs data, etc.)
- Stocks at interesting technical levels heading into next week
- Any geopolitical or macro events to watch

Format as a Twitter thread. First tweet is the overview. Follow-ups cover earnings calendar, econ events, and technical setups.`,
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (!type || !TEMPLATE_PROMPTS[type]) {
    return Response.json({ error: `Invalid type: ${type}. Valid types: ${Object.keys(TEMPLATE_PROMPTS).join(', ')}` }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  try {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 1500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Today is ${today}. ${TEMPLATE_PROMPTS[type]}

IMPORTANT: Return ONLY a JSON array of tweet strings. No markdown, no backticks, no explanation. Just the raw JSON array like:
["First tweet text here", "Second tweet text here", "Third tweet text here"]

Each tweet must be under 280 characters. Use real current data from your web search.`
        }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Claude API error:', err);
      return Response.json({ error: 'Claude API error' }, { status: 500 });
    }

    const data = await res.json();

    // Extract text from Claude response (may have multiple content blocks)
    const textBlocks = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // Parse the JSON array of tweets
    let tweets;
    try {
      // Clean up any markdown fencing
      const cleaned = textBlocks.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      tweets = JSON.parse(cleaned);
    } catch (parseErr) {
      // If JSON parse fails, split by double newline as fallback
      tweets = textBlocks.split(/\n\n+/).filter(t => t.trim().length > 0);
    }

    // Format into the structure the frontend expects
    if (!Array.isArray(tweets) || tweets.length === 0) {
      return Response.json({ error: 'Failed to generate content' }, { status: 500 });
    }

    const content = tweets.length === 1
      ? { tweet: tweets[0] }
      : { tweet: tweets[0], thread: tweets.slice(1) };

    return Response.json({
      content,
      type,
      generatedAt: new Date().toISOString(),
      tweetCount: tweets.length,
    });

  } catch (err) {
    console.error('Generate content error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
