export const runtime = "edge";

const CRYPTO_MAP = { BTC: "BTC/USD", ETH: "ETH/USD", SOL: "SOL/USD", XRP: "XRP/USD", DOGE: "DOGE/USD" };

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const ticker = (searchParams.get("ticker") || "").toUpperCase();
  if (!ticker) return Response.json({ error: "Missing ticker" }, { status: 400 });

  const key = process.env.ALPACA_API_KEY;
  const secret = process.env.ALPACA_API_SECRET;
  if (!key || !secret) return Response.json({ error: "Missing Alpaca keys" }, { status: 500 });

  const headers = { "APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": secret };
  const isCrypto = !!CRYPTO_MAP[ticker];

  try {
    if (isCrypto) {
      const symbol = CRYPTO_MAP[ticker];
      const res = await fetch(
        `https://data.alpaca.markets/v1beta3/crypto/us/latest/trades?symbols=${encodeURIComponent(symbol)}`,
        { headers }
      );
      const data = await res.json();
      const trade = data?.trades?.[symbol];
      if (!trade) return Response.json({ error: "No data" }, { status: 404 });

      // Get previous bar for change calc
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000 * 2);
      const barsRes = await fetch(
        `https://data.alpaca.markets/v1beta3/crypto/us/bars?symbols=${encodeURIComponent(symbol)}&timeframe=1Day&start=${yesterday.toISOString()}&limit=2`,
        { headers }
      );
      const barsData = await barsRes.json();
      const bars = barsData?.bars?.[symbol] || [];
      const prevClose = bars.length > 0 ? bars[0].c : null;

      return Response.json({
        ticker,
        price: trade.p,
        change: prevClose ? trade.p - prevClose : null,
        changePercent: prevClose ? ((trade.p - prevClose) / prevClose) * 100 : null,
        isCrypto: true,
      });
    }

    // Stock — use snapshot
    const snapRes = await fetch(
      `https://data.alpaca.markets/v2/stocks/${ticker}/snapshot`,
      { headers }
    );
    if (!snapRes.ok) return Response.json({ error: "Not found" }, { status: 404 });
    const snap = await snapRes.json();

    const price = snap.latestTrade?.p || snap.minuteBar?.c || null;
    const prevClose = snap.prevDailyBar?.c || null;
    const open = snap.dailyBar?.o || null;
    const high = snap.dailyBar?.h || null;
    const low = snap.dailyBar?.l || null;
    const volume = snap.dailyBar?.v || null;
    const change = price && prevClose ? price - prevClose : null;
    const changePercent = change && prevClose ? (change / prevClose) * 100 : null;

    return Response.json({
      ticker,
      price,
      prevClose,
      open,
      high,
      low,
      volume,
      change,
      changePercent,
      isCrypto: false,
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
