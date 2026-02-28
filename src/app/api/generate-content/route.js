// /api/generate-content/route.js
// Fetches LIVE market data from Twelve Data, then Claude formats into posts

export const maxDuration = 30;

const MARKET_TICKERS = ['SPY', 'QQQ', 'DIA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'];
const CRYPTO_TICKERS = ['BTC/USD', 'ETH/USD', 'SOL/USD'];

async function fetchTwelveData(symbols, apiKey) {
  try {
    const results = {};
    const stockSymbols = symbols.filter(s => !s.includes('/'));
    if (stockSymbols.length > 0) {
      const stockRes = await fetch(
        `https://api.twelvedata.com/quote?symbol=${stockSymbols.join(',')}&apikey=${apiKey}`
      );
      const stockData = await stockRes.json();
      if (stockSymbols.length === 1) {
        if (stockData.symbol) results[stockData.symbol] = stockData;
      } else {
        for (const sym of stockSymbols) {
          if (stockData[sym] && !stockData[sym].code) results[sym] = stockData[sym];
        }
      }
    }
    const cryptoSymbols = symbols.filter(s => s.includes('/'));
    for (const crypto of cryptoSymbols) {
      try {
        const cryptoRes = await fetch(
          `https://api.twelvedata.com/quote?symbol=${crypto}&apikey=${apiKey}`
        );
        const cryptoData = await cryptoRes.json();
        if (cryptoData.symbol) results[crypto] = cryptoData;
      } catch (e) { console.warn(`Failed to fetch ${crypto}`); }
    }
    return results;
  } catch (err) {
    console.error('Twelve Data fetch error:', err);
    return {};
  }
}

function formatMarketSnapshot(quotes) {
  let snapshot = '=== LIVE MARKET DATA (from Twelve Data) ===\n\n';
  for (const [symbol, data] of Object.entries(quotes)) {
    if (!data || data.code) continue;
    const price = parseFloat(data.close || data.price || 0);
    const prevClose = parseFloat(data.previous_close || 0);
    const change = prevClose ? ((price - prevClose) / prevClose * 100).toFixed(2) : '0.00';
    const direction = parseFloat(change) >= 0 ? '+' : '';
    snapshot += `${symbol}: $${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${direction}${change}%)\n`;
    if (data.volume) snapshot += `  Volume: ${parseInt(data.volume).toLocaleString()}\n`;
  }
  return snapshot;
}

const TEMPLATE_PROMPTS = {
  'morning-briefing': `Generate a MARKET OPEN BRIEFING for @stratify_hq using the live data provided AND search the web for: overnight futures, key economic data releases today, notable earnings reports today, pre-market catalysts. Format: First tweet is summary with emoji bullets. Thread covers Futures/Levels, Earnings, Econ Data, Key Levels. Use EXACT prices from live data.`,
  'technical-setups': `Generate TECHNICAL SETUPS for @stratify_hq using live data AND search for: breakout levels, key support/resistance for SPY/QQQ, RSI/MACD signals, sector rotation. Format: First tweet summarizes. Thread covers individual setups with entry/target/stop using REAL prices.`,
  'top-movers': `Generate TOP MOVERS for @stratify_hq. Use live data AND search for: biggest % gainers and losers TODAY, catalysts, volume spikes. Format: First tweet summary. Thread covers top 3 gainers, top 3 losers with % moves and catalysts.`,
  'midday-update': `Generate MIDDAY UPDATE for @stratify_hq using live data AND search for: sector performance, breaking midday news, momentum shifts. Format: First tweet is market snapshot with exact SPY/QQQ/DIA levels. Thread covers sectors and moves.`,
  'power-hour': `Generate POWER HOUR post for @stratify_hq using live data AND search for: momentum into close, key levels, volume trends. Format: First tweet sets the scene. Thread covers levels and momentum plays.`,
  'market-recap': `Generate MARKET RECAP for @stratify_hq using live data AND search for: full day summary, sector breakdown, AH earnings, VIX. Format: First tweet is closing summary with exact prices. Thread covers sectors, movers, earnings.`,
  'ah-movers': `Generate AFTER HOURS MOVERS for @stratify_hq. Search for: AH movers, earnings beats/misses with actual vs expected, guidance. Format: First tweet summarizes AH action. Thread covers each major report.`,
  'weekend-watchlist': `Generate WEEKEND WATCHLIST for @stratify_hq using current prices AND search for: major earnings next week, econ calendar, stocks at key technical levels. Format: First tweet overview. Thread covers earnings, econ events, setups with REAL prices.`,
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (!type || !TEMPLATE_PROMPTS[type]) {
    return Response.json({ error: `Invalid type: ${type}` }, { status: 400 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const twelveKey = process.env.TWELVE_DATA_API_KEY;

  if (!anthropicKey) return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  if (!twelveKey) return Response.json({ error: 'TWELVE_DATA_API_KEY not configured' }, { status: 500 });

  try {
    // Step 1: Fetch LIVE prices from Twelve Data
    const quotes = await fetchTwelveData([...MARKET_TICKERS, ...CRYPTO_TICKERS], twelveKey);
    const marketSnapshot = formatMarketSnapshot(quotes);

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    // Step 2: Send live data + template to Claude with web search
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Today is ${today}.

Here is LIVE market data pulled just now from Twelve Data (use these EXACT prices):

${marketSnapshot}

TASK: ${TEMPLATE_PROMPTS[type]}

IMPORTANT: Return ONLY a JSON array of tweet strings. No markdown, no backticks, no explanation. Just the raw JSON array like:
["First tweet text here", "Second tweet text here", "Third tweet text here"]

Each tweet MUST be under 280 characters. Use the EXACT prices from the live data above. Supplement with web search for news, earnings, and catalysts.`
        }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Claude API error:', err);
      return Response.json({ error: 'Claude API error' }, { status: 500 });
    }

    const data = await res.json();
    const textBlocks = data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');

    let tweets;
    try {
      const cleaned = textBlocks.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      tweets = JSON.parse(cleaned);
    } catch (parseErr) {
      tweets = textBlocks.split(/\n\n+/).filter(t => t.trim().length > 0 && t.trim() !== '[]');
    }

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
      marketData: Object.keys(quotes).length + ' symbols loaded',
    });

  } catch (err) {
    console.error('Generate content error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
