'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Send, ChevronDown, ChevronUp, Loader2, Terminal, X, TrendingUp, Trophy } from 'lucide-react';

const STARTER_QUESTIONS = [
  { label: '📈 How is $TSLA performing today?', text: 'How is $TSLA performing today?' },
  { label: '📊 Show me 1HR chart of $AAPL', text: 'Show me 1 hour chart of $AAPL' },
  { label: '🏦 What\'s the Fed fund rate?', text: 'What\'s the current Federal Funds rate and what\'s the Fed\'s latest outlook?' },
  { label: '🏆 Trending sports', text: 'What\'s trending in sports right now? NFL, NBA, NHL playoffs, any big games or trades happening?' },
];

const TICKER_PATTERN = /\$([A-Z]{1,5})\b|\b(AAPL|TSLA|NVDA|AMZN|GOOGL|GOOG|META|MSFT|AMD|COIN|NFLX|PYPL|SOFI|PLTR|SPY|QQQ|HIMS|DIS|BA|INTC|UBER|SHOP|SQ|RIVN|LCID|NIO|MARA|RIOT|BTC|ETH|SOL|XRP|DOGE)\b/gi;
const SPORTS_KEYWORDS = /\b(NFL|NBA|NHL|MLB|NCAA|Super\s*Bowl|playoff|World\s*Series|Stanley\s*Cup|championship|ESPN|football|basketball|hockey|baseball|soccer|Premier\s*League|UFC|MMA|boxing|F1|Formula|tennis|golf|PGA|Olympics|March\s*Madness|sport|game\s*tonight|score)\b/gi;
const FINANCE_KEYWORDS = /\b(fed\s*fund|federal\s*fund|interest\s*rate|treasury|yield|bond|10.year|2.year|inflation|CPI|GDP|unemployment)\b/gi;

const TIMEFRAME_MAP = [
  { pattern: /\b1\s*min(ute)?\b/i, interval: '1' },
  { pattern: /\b3\s*min(ute)?\b/i, interval: '3' },
  { pattern: /\b5\s*min(ute)?\b/i, interval: '5' },
  { pattern: /\b15\s*min(ute)?\b/i, interval: '15' },
  { pattern: /\b30\s*min(ute)?\b/i, interval: '30' },
  { pattern: /\b1\s*h(our|r)?\b/i, interval: '60' },
  { pattern: /\b4\s*h(our|r)?\b/i, interval: '240' },
  { pattern: /\bdaily\b|\b1\s*d(ay)?\b/i, interval: 'D' },
  { pattern: /\bweekly\b|\b1\s*w(eek)?\b/i, interval: 'W' },
  { pattern: /\bmonthly\b|\b1\s*m(onth)\b/i, interval: 'M' },
];

function extractTickers(messages) {
  const tickers = new Set();
  for (const msg of messages) {
    if (msg.role !== 'user') continue;
    const text = msg.content || '';
    let match;
    const regex = new RegExp(TICKER_PATTERN.source, 'gi');
    while ((match = regex.exec(text)) !== null) {
      tickers.add((match[1] || match[2]).toUpperCase());
    }
  }
  const arr = Array.from(tickers);
  return arr.length > 0 ? arr[arr.length - 1] : null;
}

function extractTimeframe(text) {
  for (const { pattern, interval } of TIMEFRAME_MAP) {
    if (pattern.test(text)) return interval;
  }
  return null;
}

const INTERVAL_LABELS = { '1': '1m', '3': '3m', '5': '5m', '15': '15m', '30': '30m', '60': '1H', '240': '4H', 'D': '1D', 'W': '1W', 'M': '1M' };
const INTERVAL_OPTIONS = ['1', '5', '15', '60', 'D', 'W'];

function StockPanel({ ticker, interval, onTickerChange, onIntervalChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(ticker);
  const inputRef = useRef(null);
  const cryptoMap = { BTC: 'COINBASE:BTCUSD', ETH: 'COINBASE:ETHUSD', SOL: 'COINBASE:SOLUSD', XRP: 'COINBASE:XRPUSD', DOGE: 'COINBASE:DOGEUSD' };
  const tvSymbol = cryptoMap[ticker] || ticker;

  useEffect(() => { setDraft(ticker); }, [ticker]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const commit = () => {
    const val = draft.trim().toUpperCase().replace(/^\$/, '');
    if (val && val !== ticker) onTickerChange(val);
    setEditing(false);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-black/40">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
        {editing ? (
          <input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            onBlur={commit}
            className="w-20 bg-transparent text-sm font-semibold text-zinc-100 outline-none border-b border-emerald-400/50 font-mono uppercase" />
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="text-sm font-semibold text-zinc-100 hover:text-emerald-300 transition" title="Click to change ticker">
            ${ticker}
          </button>
        )}
        <div className="ml-auto flex gap-1">
          {INTERVAL_OPTIONS.map((iv) => (
            <button key={iv} type="button" onClick={() => onIntervalChange(iv)}
              className={`rounded px-1.5 py-0.5 text-[10px] font-mono transition ${interval === iv ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
              {INTERVAL_LABELS[iv]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <iframe
          key={`${tvSymbol}_${interval}`}
          src={`https://s.tradingview.com/widgetembed/?hideideas=1&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en#{"symbol":"${tvSymbol}","frameElementId":"tv_${tvSymbol}_${interval}","interval":"${interval}","hide_top_toolbar":"1","hide_legend":"1","save_image":"0","calendar":"0","hide_volume":"1","support_host":"https://www.tradingview.com","theme":"dark","style":"1","timezone":"America/New_York","withdateranges":"0","studies":[],"backgroundColor":"rgba(0,0,0,0)"}`}
          className="h-full w-full border-0"
          allowTransparency="true"
        />
      </div>
    </div>
  );
}

function SportsPanel() {
  const [scores, setScores] = useState([]);
  const [activeSport, setActiveSport] = useState('nba');
  const [loading, setLoading] = useState(true);

  const SPORTS = [
    { id: 'nba', label: '🏀 NBA' },
    { id: 'nhl', label: '🏒 NHL' },
    { id: 'nfl', label: '🏈 NFL' },
    { id: 'mlb', label: '⚾ MLB' },
  ];

  const sportPath = { nfl: 'football/nfl', nba: 'basketball/nba', nhl: 'hockey/nhl', mlb: 'baseball/mlb' };

  useEffect(() => {
    let cancelled = false;
    const fetchScores = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sportPath[activeSport]}/scoreboard`);
        const data = await res.json();
        if (!cancelled && data?.events) setScores(data.events.slice(0, 12));
      } catch {}
      if (!cancelled) setLoading(false);
    };
    fetchScores();
    return () => { cancelled = true; };
  }, [activeSport]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-black/40">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <Trophy className="h-3.5 w-3.5 text-yellow-400" />
        <span className="text-sm font-semibold text-zinc-100">Live Sports</span>
      </div>
      <div className="flex gap-1 border-b border-white/10 px-2 py-1.5">
        {SPORTS.map((sport) => (
          <button key={sport.id} type="button" onClick={() => setActiveSport(sport.id)}
            className={`rounded-md px-2 py-1 text-[11px] transition ${activeSport === sport.id ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {sport.label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
        {loading && <div className="flex items-center justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-zinc-500" /></div>}
        {!loading && scores.length === 0 && <p className="text-center text-xs text-zinc-500 py-8">No games scheduled</p>}
        {!loading && scores.map((game) => {
          const comps = game.competitions?.[0]?.competitors || [];
          const home = comps.find((c) => c.homeAway === 'home');
          const away = comps.find((c) => c.homeAway === 'away');
          const status = game.status?.type?.shortDetail || '';
          const isLive = game.status?.type?.state === 'in';
          return (
            <div key={game.id} className={`rounded-lg border px-3 py-2 ${isLive ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-black/20'}`}>
              <span className={`text-[10px] uppercase tracking-wider ${isLive ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}>
                {isLive ? '🔴 LIVE' : status}
              </span>
              {away && (
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2">
                    {away.team?.logo && <img src={away.team.logo} alt="" className="h-4 w-4" />}
                    <span className="text-xs text-zinc-200">{away.team?.abbreviation}</span>
                  </div>
                  <span className={`text-sm font-mono font-semibold ${Number(away.score) > Number(home?.score) ? 'text-white' : 'text-zinc-500'}`}>{away.score ?? '-'}</span>
                </div>
              )}
              {home && (
                <div className="flex items-center justify-between mt-0.5">
                  <div className="flex items-center gap-2">
                    {home.team?.logo && <img src={home.team.logo} alt="" className="h-4 w-4" />}
                    <span className="text-xs text-zinc-200">{home.team?.abbreviation}</span>
                  </div>
                  <span className={`text-sm font-mono font-semibold ${Number(home.score) > Number(away?.score) ? 'text-white' : 'text-zinc-500'}`}>{home.score ?? '-'}</span>
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
  const [showChart, setShowChart] = useState(false);
  const [showSports, setShowSports] = useState(false);
  const [manualTicker, setManualTicker] = useState(null);
  const [chartInterval, setChartInterval] = useState('D');
  const scrollRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const userMessages = useMemo(() => messages.filter((m) => m.role === 'user'), [messages]);
  const detectedTicker = useMemo(() => extractTickers(messages), [userMessages.length]);
  const activeTicker = manualTicker || detectedTicker;

  // Auto-open panels when relevant content detected
  const prevUserCountRef = useRef(0);
  useEffect(() => {
    if (userMessages.length > prevUserCountRef.current) {
      const lastUser = userMessages[userMessages.length - 1]?.content || '';
      if (new RegExp(TICKER_PATTERN.source, 'gi').test(lastUser) || new RegExp(FINANCE_KEYWORDS.source, 'gi').test(lastUser)) {
        setShowChart(true);
        setManualTicker(null); // let detection pick up new ticker
        const tf = extractTimeframe(lastUser);
        if (tf) setChartInterval(tf);
      }
      if (new RegExp(SPORTS_KEYWORDS.source, 'gi').test(lastUser)) {
        setShowSports(true);
      }
    }
    prevUserCountRef.current = userMessages.length;
  }, [userMessages.length]);

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
        if (tokenCount % 5 === 0) requestAnimationFrame(scrollToBottom);
      }
      requestAnimationFrame(scrollToBottom);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${e.message}` }]);
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const panelCount = (showChart ? 1 : 0) + (showSports ? 1 : 0);

  return (
    <div className="w-full mb-4">
      {/* Starter questions */}
      <div className="mb-3 flex flex-wrap gap-2">
        {STARTER_QUESTIONS.map((q) => (
          <button key={q.text} type="button" onClick={() => sendMessage(q.text)} disabled={streaming}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-300 hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-emerald-300 transition disabled:opacity-40">
            {q.label}
          </button>
        ))}
      </div>

      {/* Chat messages */}
      {expanded && messages.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              <span className="uppercase tracking-wider font-medium text-emerald-400">Fred</span>
              <span className="text-zinc-600">·</span>
              <span>{messages.length} messages</span>
            </div>
            <button type="button" onClick={() => setMessages([])} className="rounded p-1 text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition" title="Clear chat">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div ref={scrollRef} className="h-[30vh] overflow-y-auto overscroll-contain px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'bg-emerald-500/20 border border-emerald-500/30 text-zinc-100' : 'bg-white/5 border border-white/10 text-zinc-300'
                }`}>
                  <pre className="whitespace-pre-wrap font-[inherit] m-0">{msg.content || (streaming && i === messages.length - 1 ? '...' : '')}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className={`flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm px-4 py-2.5 ${expanded && messages.length > 0 ? 'mt-2' : ''}`}>
        <Terminal className="h-4 w-4 text-emerald-400 shrink-0" />
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Ask Fred anything..." disabled={streaming}
          className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none font-mono" />
        {messages.length > 0 && !expanded && (
          <button type="button" onClick={() => setExpanded(true)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition">
            <span>{messages.length} msgs</span><ChevronDown className="h-3 w-3" />
          </button>
        )}
        {expanded && messages.length > 0 && (
          <button type="button" onClick={() => setExpanded(false)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition">
            <ChevronUp className="h-3 w-3" />
          </button>
        )}
        <button type="button" onClick={() => sendMessage()} disabled={streaming || !input.trim()}
          className="flex items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30 p-1.5 text-emerald-400 hover:bg-emerald-500/30 transition disabled:opacity-30 disabled:cursor-not-allowed">
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>

      {/* Mini tabs — toggle panels */}
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => setShowChart((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition ${
            showChart ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300' : 'border-white/10 bg-black/30 text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}>
          <TrendingUp className="h-3.5 w-3.5" />
          {activeTicker ? `$${activeTicker} Chart` : 'Stock Chart'}
        </button>
        <button type="button" onClick={() => setShowSports((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition ${
            showSports ? 'border-yellow-400/40 bg-yellow-500/15 text-yellow-300' : 'border-white/10 bg-black/30 text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}>
          <Trophy className="h-3.5 w-3.5" />
          Live Sports
        </button>
      </div>

      {/* Panels — both can be open */}
      {(showChart || showSports) && (
        <div className={`mt-2 grid gap-3 h-[35vh] ${panelCount === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {showChart && (
            <StockPanel ticker={activeTicker || 'SPY'} interval={chartInterval} onTickerChange={(t) => setManualTicker(t)} onIntervalChange={(iv) => setChartInterval(iv)} />
          )}
          {showSports && (
            <SportsPanel />
          )}
        </div>
      )}
    </div>
  );
}
