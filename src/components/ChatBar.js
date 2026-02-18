'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Send, ChevronDown, ChevronUp, Loader2, Terminal, X, TrendingUp } from 'lucide-react';

// Common tickers to detect in conversation
const TICKER_PATTERN = /\$([A-Z]{1,5})\b|\b(AAPL|TSLA|NVDA|AMZN|GOOGL|GOOG|META|MSFT|AMD|COIN|NFLX|PYPL|SOFI|PLTR|SPY|QQQ|HIMS|DIS|BA|INTC|UBER|SHOP|SQ|RIVN|LCID|NIO|MARA|RIOT|BTC|ETH|SOL|XRP|DOGE)\b/gi;

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
  // Return last mentioned ticker (most relevant)
  const arr = Array.from(tickers);
  return arr.length > 0 ? arr[arr.length - 1] : null;
}

function StockSidebar({ ticker }) {
  if (!ticker) return null;

  // Map crypto tickers to TradingView format
  const cryptoMap = { BTC: 'COINBASE:BTCUSD', ETH: 'COINBASE:ETHUSD', SOL: 'COINBASE:SOLUSD', XRP: 'COINBASE:XRPUSD', DOGE: 'COINBASE:DOGEUSD' };
  const tvSymbol = cryptoMap[ticker] || ticker;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-black/40">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-sm font-semibold text-zinc-100">${ticker}</span>
      </div>

      {/* TradingView Chart */}
      <div className="flex-1 min-h-0">
        <iframe
          key={tvSymbol}
          src={`https://s.tradingview.com/widgetembed/?hideideas=1&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en#{"symbol":"${tvSymbol}","frameElementId":"tradingview_widget","interval":"D","hide_top_toolbar":"1","hide_legend":"1","save_image":"0","calendar":"0","hide_volume":"1","support_host":"https://www.tradingview.com","theme":"dark","style":"1","timezone":"America/New_York","withdateranges":"0","studies":[],"backgroundColor":"rgba(0,0,0,0)"}`}
          className="h-full w-full border-0"
          allowTransparency="true"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
        />
      </div>

      {/* Quick Info Footer */}
      <div className="border-t border-white/10 px-3 py-2">
        <p className="text-[11px] text-zinc-500">
          TradingView · {ticker} · Real-time
        </p>
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

  // Detect ticker from conversation
  const activeTicker = useMemo(() => extractTickers(messages), [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
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
      {/* Chat panel with optional stock sidebar */}
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

          {/* Two-column layout: chat + stock sidebar */}
          <div className={`flex ${activeTicker ? 'h-[45vh]' : 'h-[35vh]'}`}>
            {/* Messages */}
            <div
              ref={scrollRef}
              className={`overflow-y-auto overscroll-contain px-4 py-3 space-y-3 ${activeTicker ? 'w-1/2 border-r border-white/10' : 'w-full'}`}
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

            {/* Stock Sidebar — only shows when ticker detected */}
            {activeTicker && (
              <div className="w-1/2">
                <StockSidebar ticker={activeTicker} />
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
          onClick={sendMessage}
          disabled={streaming || !input.trim()}
          className="flex items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30 p-1.5 text-emerald-400 hover:bg-emerald-500/30 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
