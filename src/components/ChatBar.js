'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, ChevronDown, ChevronUp, Loader2, Terminal, X } from 'lucide-react';

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

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    setExpanded(true);

    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setStreaming(true);

    // Scroll after user message renders
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
        // Only auto-scroll every 5 chunks to prevent jitter
        if (tokenCount % 5 === 0) {
          requestAnimationFrame(scrollToBottom);
        }
      }
      // Final scroll
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
      {/* Input bar — always at top */}
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm px-4 py-2.5">
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

      {/* Chat messages panel — below input, fixed height, internal scroll */}
      {expanded && messages.length > 0 && (
        <div className="mt-2 rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              <span className="uppercase tracking-wider font-medium text-emerald-400">Fred</span>
              <span className="text-zinc-600">·</span>
              <span>{messages.length} messages</span>
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

          {/* Messages — fixed height container with internal scroll only */}
          <div
            ref={scrollRef}
            className="h-[35vh] overflow-y-auto overscroll-contain px-4 py-3 space-y-3"
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
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
        </div>
      )}
    </div>
  );
}
