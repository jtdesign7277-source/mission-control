'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Hash,
  MessageSquare,
  TrendingUp,
  Users,
  Zap,
  Shield,
  Star,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

/* ─── config ────────────────────────────────────────────── */
// Replace with your real Discord server ID once created
const DISCORD_SERVER_ID = '1473541777829925078';
const DISCORD_INVITE = 'https://discord.gg/DBb2W6Rk';

const CHANNELS = [
  { name: 'general', icon: '💬', desc: 'Main hangout — intros, questions, vibes' },
  { name: 'trade-setups', icon: '📊', desc: 'Share your entries, exits, and chart analysis' },
  { name: 'strategies', icon: '🧠', desc: 'Discuss and refine trading strategies' },
  { name: 'show-your-pnl', icon: '💰', desc: 'Post your P&L — wins AND losses' },
  { name: 'feature-requests', icon: '💡', desc: 'Ideas to make Stratify better' },
  { name: 'bug-reports', icon: '🐛', desc: 'Found something broken? Report it here' },
  { name: 'market-talk', icon: '📈', desc: 'Real-time market discussion and news' },
  { name: 'announcements', icon: '📣', desc: 'Official Stratify updates and releases' },
];

const RULES = [
  { title: 'No Financial Advice', desc: 'Everything shared is for educational purposes. Do your own DD.' },
  { title: 'Be Respectful', desc: 'Disagree with ideas, not people. No personal attacks.' },
  { title: 'No Pump & Dump', desc: 'Don\'t shill tickers or coordinate buys. Instant ban.' },
  { title: 'Share Honestly', desc: 'Post your losses too. We learn more from red days.' },
  { title: 'Stay On Topic', desc: 'Keep channels focused. Off-topic goes in #general.' },
];

/* ─── component ─────────────────────────────────────────── */
export default function CommunityHub() {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  const copyInvite = useCallback(() => {
    if (!DISCORD_INVITE) return;
    navigator.clipboard.writeText(DISCORD_INVITE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  /* ─── no server yet ─────────────────────────────────── */
  if (!DISCORD_SERVER_ID) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 p-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-8">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="relative">
            <div className="mb-2 flex items-center gap-2 text-indigo-400">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wider">Coming Soon</span>
            </div>
            <h1 className="mb-3 text-3xl font-bold text-white">Stratify Community</h1>
            <p className="max-w-xl text-lg text-zinc-400">
              A place for traders to share setups, strategies, P&L, and ideas to make Stratify better.
              Powered by Discord, managed from Mission Control.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300">
                <MessageSquare className="h-4 w-4" />
                Discord server setup needed
              </span>
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">⚡ Quick Setup</h2>
          <ol className="space-y-3 text-sm text-zinc-400">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">1</span>
              <span>Go to <a href="https://discord.com/channels/@me" target="_blank" rel="noopener" className="text-indigo-400 underline">discord.com</a> → Create a server → Name it <strong className="text-white">Stratify</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">2</span>
              <span>Create the channels listed below (or let Fred auto-create them via bot)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">3</span>
              <span>Server Settings → Widget → Enable Widget → Copy Server ID</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">4</span>
              <span>Create an invite link (Server Settings → Invites → Create) and set it to never expire</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">5</span>
              <span>Tell Fred the Server ID + invite link → he'll wire everything up</span>
            </li>
          </ol>
        </div>

        {/* Channel Plan */}
        <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">📋 Planned Channels</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {CHANNELS.map((ch) => (
              <div key={ch.name} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <span className="text-lg">{ch.icon}</span>
                <div>
                  <p className="text-sm font-medium text-zinc-200">#{ch.name}</p>
                  <p className="text-xs text-zinc-500">{ch.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Shield className="h-5 w-5 text-amber-400" />
            Community Rules
          </h2>
          <div className="space-y-3">
            {RULES.map((r, i) => (
              <div key={i} className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <span className="mt-0.5 text-sm font-bold text-amber-400">{i + 1}.</span>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{r.title}</p>
                  <p className="text-xs text-zinc-500">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ─── server configured ─────────────────────────────── */
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Hero Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Stratify Community</h1>
          <p className="text-sm text-zinc-400">Discord hub for traders, builders, and degens</p>
        </div>
        <div className="flex items-center gap-3">
          {DISCORD_INVITE && (
            <>
              <button
                onClick={copyInvite}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Invite'}
              </button>
              <a
                href={DISCORD_INVITE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
              >
                <ExternalLink className="h-4 w-4" />
                Open Discord
              </a>
            </>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Discord Widget Embed */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]">
            <iframe
              src={`https://discord.com/widget?id=${DISCORD_SERVER_ID}&theme=dark`}
              width="100%"
              height="600"
              allowTransparency={true}
              frameBorder="0"
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
              className="w-full"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Channels */}
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Channels</h3>
            <div className="space-y-1">
              {CHANNELS.map((ch) => (
                <div key={ch.name} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200">
                  <span>{ch.icon}</span>
                  <span>#{ch.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              <Shield className="h-3.5 w-3.5 text-amber-400" />
              Rules
            </h3>
            <div className="space-y-2">
              {RULES.map((r, i) => (
                <p key={i} className="text-xs text-zinc-500">
                  <span className="font-medium text-zinc-400">{i + 1}. {r.title}</span> — {r.desc}
                </p>
              ))}
            </div>
          </div>

          {/* Quick Stats placeholder */}
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Quick Links</h3>
            <div className="space-y-2">
              <a href="https://stratify.associates" target="_blank" rel="noopener" className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-indigo-400">
                <span>Stratify App</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </a>
              <a href="https://github.com/jtdesign7277-source" target="_blank" rel="noopener" className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-indigo-400">
                <span>GitHub</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
