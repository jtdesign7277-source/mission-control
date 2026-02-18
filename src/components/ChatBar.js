'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Send, ChevronDown, ChevronUp, Loader2, Terminal, X, TrendingUp, Trophy } from 'lucide-react';

// Suggested starter questions
const STARTER_QUESTIONS = [
  { label: '📈 How is $TSLA performing today?', text: 'How is $TSLA performing today?' },
  { label: '🏦 What\'s the Fed fund rate?', text: 'What\'s the current Federal Funds rate and what\'s the Fed\'s latest outlook?' },
  { label: '🏆 Trending sports', text: 'What\'s trending in sports right now? NFL, NBA, NHL playoffs, any big games or trades happening?' },
];

// Common tickers to detect in conversation
const TICKER_PATTERN = /\$([A-Z]{1,5})\b|\b(AAPL|TSLA|NVDA|AMZN|GOOGL|GOOG|META|MSFT|AMD|COIN|NFLX|PYPL|SOFI|PLTR|SPY|QQQ|HIMS|DIS|BA|INTC|UBER|SHOP|SQ|RIVN|LCID|NIO|MARA|RIOT|BTC|ETH|SOL|XRP|DOGE)\b/gi;

// Finance/rate keywords that should show a TradingView chart
const FINANCE_KEYWORDS = /\b(fed\s*fund|federal\s*fund|interest\s*rate|treasury|yield|bond|10.year|2.year|inflation|CPI|GDP|unemployment)\b/gi;

// Sports keywords
const SPORTS_KEYWORDS = /\b(NFL|NBA|NHL|MLB|NCAA|Super\s*Bowl|playoff|World\s*Series|Stanley\s*Cup|championship|ESPN|football|basketball|hockey|baseball|soccer|Premier\s*League|UFC|MMA|boxing|F1|Formula|tennis|golf|PGA|Olympics|March\s*Madness|sport|game\s*tonight|score)\b/gi;

function extractTickers(messages) {
  const tickers = new Set();
  for (const msg of messages) {
    const text = msg.content || '';
    let match;
    const regex = new RegExp(TICKER_PATTERN.source, 'gi');
    while ((match = regex.exec(text)) !== null) {
      const ticker = (match[1] || match[2]).toUpperCase();
      tickers.add(ticker);
    }
  }
  const arr = Array.from(tickers);
  return arr.length > 0 ? arr[arr.length - 1] : null;
}

function detectSidebarType(messages) {
  // Only check USER messages to avoid re-triggering on streaming assistant responses
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== 'user') continue;
    const text = messages[i].content || '';
    if (SPORTS_KEYWORDS.test(text)) return 'sports';
    if (FINANCE_KEYWORDS.test(text)) return 'finance';
    if (TICKER_PATTERN.test(text)) return 'stock';
  }
  return null;
}

function StockSidebar({ ticker }) {
  const cryptoMap = { BTC: 'COINBASE:BTCUSD', ETH: 'COINBASE:ETHUSD', SOL: 'COINBASE:SOLUSD', XRP: 'COINBASE:XRPUSD', DOGE: 'COINBASE:DOGEUSD' };
  const tvSymbol = cryptoMap[ticker] || ticker;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-sm font-semibold text-zinc-100">${ticker}</span>
      </div>
      <div className="flex-1 min-h-0">
        <iframe
          key={tvSymbol}
          src={`https://s.tradingview.com/widgetembed/?hideideas=1&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en#{"symbol":"${tvSymbol}","frameElementId":"tradingview_widget","interval":"D","hide_top_toolbar":"1","hide_legend":"1","save_image":"0","calendar":"0","hide_volume":"1","support_host":"https://www.tradingview.com","theme":"dark","style":"1","timezone":"America/New_York","withdateranges":"0","studies":[],"backgroundColor":"rgba(0,0,0,0)"}`}
          className="h-full w-full border-0"
          allowTransparency="true"
        />
      </div>
      <div className="border-t border-white/10 px-3 py-1.5">
        <p className="text-[11px] text-zinc-500">TradingView · {ticker} · Real-time</p>
      </div>
    </div>
  );
}

function FinanceSidebar() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-sm font-semibold text-zinc-100">Rates & Macro</span>
      </div>
      <div className="flex-1 min-h-0">
        <iframe
          src={`https://s.tradingview.com/widgetembed/?hideideas=1&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en#{"symbol":"TVC:US10Y","frameElementId":"tradingview_rates","interval":"D","hide_top_toolbar":"1","hide_legend":"1","save_image":"0","calendar":"0","hide_volume":"1","support_host":"https://www.tradingview.com","theme":"dark","style":"1","timezone":"America/New_York","withdateranges":"0","studies":[],"backgroundColor":"rgba(0,0,0,0)"}`}
          className="h-full w-full border-0"
          allowTransparency="true"
        />
      </div>
      <div className="border-t border-white/10 px-3 py-1.5">
        <p className="text-[11px] text-zinc-500">TradingView · US 10Y Treasury Yield</p>
      </div>
    </div>
  );
}

function SportsSidebar() {
  const [scores, setScores] = useState([]);
  const [activeSport, setActiveSport] = useState('nba');
  const [loading, setLoading] = useState(true);

  const SPORTS = [
    { id: 'nba', label: '🏀 NBA', color: 'text-orange-400' },
    { id: 'nhl', label: '🏒 NHL', color: 'text-sky-400' },
    { id: 'nfl', label: '🏈 NFL', color: 'text-green-400' },
    { id: 'mlb', label: '⚾ MLB', color: 'text-red-400' },
  ];

  useEffect(() => {
    let cancelled = false;
    const fetchScores = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${
          activeSport === 'nfl' ? 'football' : activeSport === 'nba' ? 'basketball' : activeSport === 'nhl' ? 'hockey' : 'baseball'
        }/${activeSport}/scoreboard`);
        const data = await res.json();
        if (!cancelled && data?.events) {
          setScores(data.events.slice(0, 10));
        }
      } catch {}
      if (!cancelled) setLoading(false);
    };
    fetchScores();
    return () => { cancelled = true; };
  }, [activeSport]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <Trophy className="h-3.5 w-3.5 text-yellow-400" />
        <span className="text-sm font-semibold text-zinc-100">Live Sports</span>
      </div>

      {/* Sport tabs */}
      <div className="flex gap-1 border-b border-white/10 px-2 py-1.5">
        {SPORTS.map((sport) => (
          <button
            key={sport.id}
            type="button"
            onClick={() => setActiveSport(sport.id)}
            className={`rounded-md px-2 py-1 text-[11px] transition ${
              activeSport === sport.id
                ? 'bg-white/10 text-white'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            {sport.label}
          </button>
        ))}
      </div>

      {/* Scores */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
          </div>
        )}
        {!loading && scores.length === 0 && (
          <p className="text-center text-xs text-zinc-500 py-8">No games scheduled</p>
        )}
        {!loading && scores.map((game) => {
          const competitors = game.competitions?.[0]?.competitors || [];
          const home = competitors.find((c) => c.homeAway === 'home');
          const away = competitors.find((c) => c.homeAway === 'away');
          const status = game.status?.type?.shortDetail || game.status?.type?.description || '';
          const isLive = game.status?.type?.state === 'in';

          return (
            <div key={game.id} className={`rounded-lg border px-3 py-2 ${isLive ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-black/20'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] uppercase tracking-wider ${isLive ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}>
                  {isLive ? '🔴 LIVE' : status}
                </span>
              </div>
              {away && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {away.team?.logo && <img src={away.team.logo} alt="" className="h-4 w-4" />}
                    <span className="text-xs text-zinc-200">{away.team?.abbreviation || away.team?.shortDisplayName}</span>
                  </div>
                  <span className={`text-sm font-mono font-semibold ${Number(away.score) > Number(home?.score) ? 'text-white' : 'text-zinc-500'}`}>
                    {away.score ?? '-'}
                  </span>
                </div>
              )}
              {home && (
                <div className="flex items-center justify-between mt-0.5">
                  <div className="flex items-center gap-2">
                    {home.team?.logo && <img src={home.team.logo} alt="" className="h-4 w-4" />}
                    <span className="text-xs text-zinc-200">{home.team?.abbreviation || home.team?.shortDisplayName}</span>
                  </div>
                  <span className={`text-sm font-mono font-semibold ${Number(home.score) > Number(away?.score) ? 'text-white' : 'text-zinc-500'}`}>
                    {home.score ?? '-'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ChatBar() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // Only recalculate sidebar on user messages (not streaming updates)
  const userMessages = useMemo(() => messages.filter((m) => m.role === 'user'), [messages]);
  const activeTicker = useMemo(() => extractTickers(messages), [userMessages.length]);
  const sidebarType = useMemo(() => {
    if (activeTicker) return 'stock';
    return detectSidebarType(messages);
  }, [userMessages.length, activeTicker]);
  const showSidebar = sidebarType !== null;

  const sendMessage = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || streaming) return;
    if (!overrideText) setInput('');
    setExpanded(true);

    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setStreaming(true);

    requestAnimationFrame(scrollToBottom);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });

      if (!res.ok) {
        const err = await res.text();
        setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err}` }]);
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      let tokenCount = 0;

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        tokenCount++;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: assistantText };
          return copy;
        });
        if (tokenCount % 5 === 0) {
          requestAnimationFrame(scrollToBottom);
        }
      }
      requestAnimationFrame(scrollToBottom);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="w-full mb-4">
      {/* Starter questions — always visible */}
      <div className="mb-3 flex flex-wrap gap-2">
        {STARTER_QUESTIONS.map((q) => (
          <button
            key={q.text}
            type="button"
            onClick={() => sendMessage(q.text)}
            disabled={streaming}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-300 hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-emerald-300 transition disabled:opacity-40"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Chat panel with context sidebar */}
      {expanded && messages.length > 0 && (
        <div className="mt-2 rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              <span className="uppercase tracking-wider font-medium text-emerald-400">Fred</span>
              <span className="text-zinc-600">·</span>
              <span>{messages.length} messages</span>
              {activeTicker && (
                <>
                  <span className="text-zinc-600">·</span>
                  <span className="text-emerald-400">${activeTicker}</span>
                </>
              )}
              {sidebarType === 'finance' && (
                <>
                  <span className="text-zinc-600">·</span>
                  <span className="text-amber-400">Rates</span>
                </>
              )}
              {sidebarType === 'sports' && (
                <>
                  <span className="text-zinc-600">·</span>
                  <span className="text-yellow-400">Sports</span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setMessages([])}
              className="rounded p-1 text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition"
              title="Clear chat"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Two-column layout: chat + sidebar */}
          <div className={`flex ${showSidebar ? 'h-[45vh]' : 'h-[35vh]'}`}>
            {/* Messages */}
            <div
              ref={scrollRef}
              className={`overflow-y-auto overscroll-contain px-4 py-3 space-y-3 ${showSidebar ? 'w-1/2 border-r border-white/10' : 'w-full'}`}
            >
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-emerald-500/20 border border-emerald-500/30 text-zinc-100'
                        : 'bg-white/5 border border-white/10 text-zinc-300'
                    }`}
                  >
                    <pre className="whitespace-pre-wrap font-[inherit] m-0">{msg.content || (streaming && i === messages.length - 1 ? '...' : '')}</pre>
                  </div>
                </div>
              ))}
            </div>

            {/* Context Sidebar */}
            {showSidebar && (
              <div className="w-1/2 rounded-xl border border-white/10 bg-black/40">
                {sidebarType === 'stock' && activeTicker && <StockSidebar ticker={activeTicker} />}
                {sidebarType === 'finance' && <FinanceSidebar />}
                {sidebarType === 'sports' && <SportsSidebar />}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className={`flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm px-4 py-2.5 ${expanded && messages.length > 0 ? 'mt-2' : ''}`}>
        <Terminal className="h-4 w-4 text-emerald-400 shrink-0" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Fred anything..."
          disabled={streaming}
          className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none font-mono"
        />
        {messages.length > 0 && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition"
          >
            <span>{messages.length} msgs</span>
            <ChevronDown className="h-3 w-3" />
          </button>
        )}
        {expanded && messages.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
        )}
        <button
          type="button"
          onClick={() => sendMessage()}
          disabled={streaming || !input.trim()}
          className="flex items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30 p-1.5 text-emerald-400 hover:bg-emerald-500/30 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
