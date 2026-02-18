'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Minus, SendHorizontal, X } from 'lucide-react';

const DEFAULT_CHAT_ID = 8222086857;
const DEFAULT_WIDTH = 380;
const DEFAULT_HEIGHT = 520;
const MIN_WIDTH = 320;
const MIN_HEIGHT = 320;
const TITLE_BAR_HEIGHT = 44;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeMessage(raw) {
  if (!raw) return null;

  const id = Number(raw.id);
  if (!Number.isFinite(id)) return null;

  return {
    id,
    text: String(raw.text || ''),
    from: raw.from === 'bot' ? 'bot' : 'user',
    date: Number(raw.date) || Date.now(),
    chatId: Number(raw.chatId) || DEFAULT_CHAT_ID,
  };
}

function formatTime(value) {
  const date = new Date(Number(value) || Date.now());
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function TelegramChat({ onClose, embedded = false }) {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [minimized, setMinimized] = useState(false);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);

  const dragStartRef = useRef(null);
  const resizeStartRef = useRef(null);
  const scrollRef = useRef(null);

  const mergeMessages = useCallback((incoming) => {
    if (!Array.isArray(incoming) || incoming.length === 0) return;

    setMessages((prev) => {
      const byId = new Map(prev.map((message) => [message.id, message]));

      incoming.forEach((item) => {
        const normalized = normalizeMessage(item);
        if (!normalized) return;
        byId.set(normalized.id, normalized);
      });

      return Array.from(byId.values()).sort((a, b) => {
        if (a.date !== b.date) return a.date - b.date;
        return a.id - b.id;
      });
    });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch('/api/telegram/messages', { cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to fetch Telegram messages');
      }

      const nextMessages = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.messages)
          ? payload.messages
          : [];

      mergeMessages(nextMessages);
      setError('');
    } catch (err) {
      setError(err?.message || 'Failed to fetch Telegram messages');
    }
  }, [mergeMessages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, chatId: DEFAULT_CHAT_ID }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to send Telegram message');
      }

      mergeMessages([payload]);
      setInput('');
      setError('');
    } catch (err) {
      setError(err?.message || 'Failed to send Telegram message');
    } finally {
      setSending(false);
    }
  }, [input, sending, mergeMessages]);

  useEffect(() => {
    fetchMessages();
    const intervalId = setInterval(fetchMessages, 3000);
    return () => clearInterval(intervalId);
  }, [fetchMessages]);

  useEffect(() => {
    if (minimized) return;
    const container = scrollRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, minimized]);

  useEffect(() => {
    if (embedded) return;

    const nextX = Math.max(20, window.innerWidth - DEFAULT_WIDTH - 20);
    const nextY = Math.max(20, window.innerHeight - DEFAULT_HEIGHT - 20);
    setPosition({ x: nextX, y: nextY });
  }, [embedded]);

  useEffect(() => {
    if (embedded || (!dragging && !resizing)) return;

    const handleMouseMove = (event) => {
      if (dragging && dragStartRef.current) {
        const { startX, startY, originX, originY } = dragStartRef.current;
        const nextX = originX + (event.clientX - startX);
        const nextY = originY + (event.clientY - startY);

        const maxX = Math.max(0, window.innerWidth - size.width);
        const currentHeight = minimized ? TITLE_BAR_HEIGHT : size.height;
        const maxY = Math.max(0, window.innerHeight - currentHeight);

        setPosition({
          x: Math.round(clamp(nextX, 0, maxX)),
          y: Math.round(clamp(nextY, 0, maxY)),
        });
      }

      if (resizing && resizeStartRef.current) {
        const { startX, startY, originWidth, originHeight, originX, originY } = resizeStartRef.current;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        const maxWidth = Math.max(MIN_WIDTH, window.innerWidth - originX);
        const maxHeight = Math.max(MIN_HEIGHT, window.innerHeight - originY);

        setSize({
          width: Math.round(clamp(originWidth + dx, MIN_WIDTH, maxWidth)),
          height: Math.round(clamp(originHeight + dy, MIN_HEIGHT, maxHeight)),
        });
      }
    };

    const handleMouseUp = () => {
      setDragging(false);
      setResizing(false);
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [dragging, embedded, minimized, resizing, size.height, size.width]);

  const handleTitleMouseDown = (event) => {
    if (embedded || event.button !== 0) return;

    dragStartRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };

    document.body.style.userSelect = 'none';
    setDragging(true);
  };

  const handleResizeMouseDown = (event) => {
    if (embedded || minimized || event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    resizeStartRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originWidth: size.width,
      originHeight: size.height,
      originX: position.x,
      originY: position.y,
    };

    document.body.style.userSelect = 'none';
    setResizing(true);
  };

  const containerStyle = embedded
    ? undefined
    : {
        left: position.x,
        top: position.y,
        width: size.width,
        height: minimized ? TITLE_BAR_HEIGHT : size.height,
      };

  const wrapperClassName = embedded
    ? 'relative flex h-full min-h-[220px] w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0f] text-zinc-100'
    : 'fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0f] text-zinc-100 shadow-2xl shadow-black/50';

  return (
    <div className={wrapperClassName} style={containerStyle}>
      <div
        className={`flex h-11 items-center justify-between border-b border-white/10 bg-[#1a1a2e] px-3 ${
          embedded ? '' : 'cursor-move'
        }`}
        onMouseDown={handleTitleMouseDown}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-100">
          <span aria-hidden="true" className="text-base">✈️</span>
          <span>Telegram — Fred</span>
        </div>

        {!embedded && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMinimized((prev) => !prev)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-300 transition hover:bg-white/10 hover:text-white"
              aria-label={minimized ? 'Restore Telegram window' : 'Minimize Telegram window'}
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-300 transition hover:bg-rose-500/20 hover:text-rose-200"
              aria-label="Close Telegram window"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {!minimized && (
        <>
          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-[#0a0a0f] px-3 py-3">
            {messages.length === 0 && (
              <p className="rounded-lg border border-dashed border-white/10 bg-black/20 px-3 py-4 text-xs text-zinc-500">
                No Telegram messages yet.
              </p>
            )}

            {messages.map((message) => {
              const isUser = message.from === 'user';

              return (
                <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      isUser
                        ? 'bg-blue-600/80 text-white'
                        : 'bg-zinc-800 text-zinc-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.text || ' '}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        isUser ? 'text-blue-100/80 text-right' : 'text-zinc-400'
                      }`}
                    >
                      {formatTime(message.date)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-white/10 bg-[#11111a] p-3">
            {error && <p className="mb-2 text-xs text-rose-300">{error}</p>}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Message Fred on Telegram..."
                className="h-10 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-blue-400/50"
                disabled={sending}
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-blue-600/80 px-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {!embedded && (
            <button
              type="button"
              onMouseDown={handleResizeMouseDown}
              className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize"
              aria-label="Resize Telegram window"
            >
              <span className="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 border-b-2 border-r-2 border-white/30" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
