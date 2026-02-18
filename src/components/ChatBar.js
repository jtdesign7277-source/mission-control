'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, ChevronDown, ChevronUp, Loader2, Terminal, X } from 'lucide-react';

export default function ChatBar() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (expanded) scrollToBottom();
  }, [messages, expanded, scrollToBottom]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    setExpanded(true);

    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setStreaming(true);

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

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: assistantText };
          return copy;
        });
      }
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
      {/* Chat messages panel — expandable */}
      {expanded && messages.length > 0 && (
        <div className="mb-2 rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              <span className="uppercase tracking-wider font-medium text-emerald-400">Fred</span>
              <span className="text-zinc-600">·</span>
              <span>{messages.length} messages</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMessages([])}
                className="rounded p-1 text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition"
                title="Clear chat"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded p-1 text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="max-h-[40vh] overflow-y-auto px-4 py-3 space-y-3">
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
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Collapsed indicator */}
      {!expanded && messages.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mb-2 flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 hover:border-white/20 transition w-full"
        >
          <Terminal className="h-3 w-3 text-emerald-400" />
          <span>{messages.length} messages with Fred</span>
          <ChevronDown className="h-3 w-3 ml-auto" />
        </button>
      )}

      {/* Input bar — always visible */}
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm px-4 py-2.5">
        <Terminal className="h-4 w-4 text-emerald-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Fred anything..."
          disabled={streaming}
          className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none font-mono"
        />
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
