'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Hash,
  MessageSquare,
  Users,
  Shield,
  ExternalLink,
  Copy,
  Check,
  Send,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Loader2,
} from 'lucide-react';

const DISCORD_INVITE = 'https://discord.gg/6RPsREggYV';
const REFRESH_MS = 15000;

const RULES = [
  { title: 'No Financial Advice', desc: 'Everything shared is for educational purposes.' },
  { title: 'Be Respectful', desc: 'Disagree with ideas, not people.' },
  { title: 'No Pump & Dump', desc: 'No shilling tickers or coordinating buys.' },
  { title: 'Share Honestly', desc: 'Post your losses too.' },
  { title: 'Stay On Topic', desc: 'Keep channels focused.' },
];

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function avatarUrl(user) {
  if (!user) return null;
  if (user.avatar) return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`;
  const idx = user.discriminator === '0' ? (BigInt(user.id) >> 22n) % 6n : parseInt(user.discriminator) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

export default function CommunityHub() {
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);
  const [view, setView] = useState('feed'); // 'feed' | 'channel'
  const bottomRef = useRef(null);

  // Fetch channels
  useEffect(() => {
    fetch('/api/discord/channels')
      .then((r) => r.json())
      .then((d) => { if (d.channels) setChannels(d.channels); })
      .catch(() => {});
  }, []);

  // Fetch server info
  useEffect(() => {
    fetch('/api/discord/members')
      .then((r) => r.json())
      .then((d) => { if (d.memberCount != null) setServerInfo(d); })
      .catch(() => {});
  }, []);

  // Fetch messages (all or per-channel)
  const fetchMessages = useCallback(() => {
    const url = activeChannel
      ? `/api/discord/messages?channelId=${activeChannel}&limit=50`
      : '/api/discord/messages?limit=50';

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (activeChannel) {
          setMessages(d.messages || []);
        } else {
          setAllMessages(d.messages || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeChannel]);

  useEffect(() => {
    setLoading(true);
    fetchMessages();
    const iv = setInterval(fetchMessages, REFRESH_MS);
    return () => clearInterval(iv);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, allMessages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !activeChannel) return;
    setSending(true);
    try {
      await fetch('/api/discord/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: activeChannel, content: input.trim() }),
      });
      setInput('');
      setTimeout(fetchMessages, 500);
    } catch {}
    setSending(false);
  }, [input, activeChannel, fetchMessages]);

  const copyInvite = useCallback(() => {
    navigator.clipboard.writeText(DISCORD_INVITE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const displayMessages = activeChannel ? messages : allMessages;
  const activeChannelName = channels.find((c) => c.id === activeChannel)?.name;

  return (
    <div className="space-y-4 p-2">
      {/* Hero */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-[#5865F2]/15 via-indigo-500/10 to-purple-500/10 p-5">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-white">
            <MessageSquare className="h-5 w-5 text-[#5865F2]" />
            Stratify Community
          </h1>
          {serverInfo && (
            <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{serverInfo.memberCount} members</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{serverInfo.onlineCount} online</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyInvite} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/10">
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Invite'}
          </button>
          <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[#5865F2] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4752C4]">
            Open Discord <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid gap-4 lg:grid-cols-[220px_1fr_260px]" style={{ minHeight: 'calc(100vh - 380px)' }}>
        {/* Channel List */}
        <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-3">
          <button
            onClick={() => { setActiveChannel(null); setView('feed'); }}
            className={`mb-2 w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium transition ${!activeChannel ? 'bg-[#5865F2]/20 text-[#5865F2]' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}`}
          >
            📡 All Channels
          </button>
          <div className="space-y-0.5">
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => { setActiveChannel(ch.id); setView('channel'); }}
                className={`w-full rounded-lg px-2 py-1.5 text-left text-xs transition ${activeChannel === ch.id ? 'bg-white/10 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}`}
              >
                <Hash className="mr-1 inline h-3 w-3" />
                {ch.name}
              </button>
            ))}
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0b1220] min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
            <span className="text-sm font-medium text-zinc-300">
              {activeChannel ? `#${activeChannelName}` : 'All Channels'}
            </span>
            <button onClick={fetchMessages} className="text-zinc-600 hover:text-zinc-300">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: '0' }}>
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
              </div>
            ) : displayMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-zinc-600">
                <MessageSquare className="mb-2 h-8 w-8" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Be the first to post!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...displayMessages].reverse().map((msg) => (
                  <div key={msg.id} className="group flex gap-2.5">
                    <img
                      src={avatarUrl(msg.author)}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-full bg-zinc-800"
                    />
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-xs font-semibold ${msg.author?.bot ? 'text-[#5865F2]' : 'text-zinc-300'}`}>
                          {msg.author?.global_name || msg.author?.username || 'Unknown'}
                          {msg.author?.bot && <span className="ml-1 rounded bg-[#5865F2]/20 px-1 py-0.5 text-[10px] uppercase">bot</span>}
                        </span>
                        {msg._channelName && !activeChannel && (
                          <span className="text-xs text-zinc-700">#{msg._channelName}</span>
                        )}
                        <span className="text-xs text-zinc-700">{timeAgo(msg.timestamp)}</span>
                      </div>
                      <p className="text-xs text-zinc-400 break-words whitespace-pre-wrap">{msg.content}</p>
                      {msg.attachments?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {msg.attachments.map((a) => (
                            <a key={a.id} href={a.url} target="_blank" rel="noopener" className="text-xs text-indigo-400 underline">{a.filename}</a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Send bar (only when viewing a specific channel) */}
          {activeChannel && (
            <div className="border-t border-white/5 p-3">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={`Message #${activeChannelName}...`}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-[#5865F2]/50"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !input.trim()}
                  className="rounded-lg bg-[#5865F2] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#4752C4] disabled:opacity-40"
                >
                  {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          {/* Rules */}
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-3">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              <Shield className="h-3 w-3 text-amber-400" /> Rules
            </h3>
            <div className="space-y-1.5">
              {RULES.map((r, i) => (
                <p key={i} className="text-xs text-zinc-600">
                  <span className="font-medium text-zinc-500">{i + 1}. {r.title}</span> — {r.desc}
                </p>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-600">Links</h3>
            <div className="space-y-1">
              {[
                ['Stratify App', 'https://stratify.associates'],
                ['GitHub', 'https://github.com/jtdesign7277-source'],
                ['Discord', DISCORD_INVITE],
              ].map(([label, url]) => (
                <a key={label} href={url} target="_blank" rel="noopener" className="flex items-center justify-between rounded px-1.5 py-1 text-xs text-zinc-500 hover:bg-white/5 hover:text-indigo-400">
                  {label}
                  <ChevronRight className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>

          {/* Invite Card */}
          <div className="rounded-2xl border border-[#5865F2]/20 bg-[#5865F2]/5 p-3 text-center">
            <p className="mb-1.5 text-xs font-medium text-zinc-400">Share with traders</p>
            <div className="mb-2 rounded bg-black/30 px-2 py-1 text-xs font-mono text-zinc-500 select-all">{DISCORD_INVITE}</div>
            <button onClick={copyInvite} className="w-full rounded-lg bg-[#5865F2] py-1.5 text-xs font-semibold text-white hover:bg-[#4752C4]">
              {copied ? '✓ Copied!' : 'Copy Invite Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
