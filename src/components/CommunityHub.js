'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Hash,
  MessageSquare,
  Users,
  Shield,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Zap,
  Target,
  BarChart3,
  Lightbulb,
  Bug,
  Megaphone,
} from 'lucide-react';

/* ─── config ────────────────────────────────────────────── */
const DISCORD_INVITE = 'https://discord.gg/6RPsREggYV';
const DISCORD_SERVER_ID = '1473541777829925078';

const CHANNELS = [
  { name: 'general', icon: MessageSquare, color: 'text-zinc-400', desc: 'Main hangout — intros, questions, vibes' },
  { name: 'announcements', icon: Megaphone, color: 'text-amber-400', desc: 'Official Stratify updates and releases' },
  { name: 'trade-setups', icon: Target, color: 'text-emerald-400', desc: 'Share your entries, exits, and chart analysis' },
  { name: 'strategies', icon: Zap, color: 'text-indigo-400', desc: 'Discuss and refine trading strategies' },
  { name: 'show-your-pnl', icon: BarChart3, color: 'text-pink-400', desc: 'Post your P&L — wins AND losses' },
  { name: 'feature-requests', icon: Lightbulb, color: 'text-yellow-400', desc: 'Ideas to make Stratify better' },
  { name: 'bug-reports', icon: Bug, color: 'text-red-400', desc: 'Found something broken? Report it here' },
  { name: 'market-talk', icon: TrendingUp, color: 'text-cyan-400', desc: 'Real-time market discussion and news' },
];

const RULES = [
  { title: 'No Financial Advice', desc: 'Everything shared is for educational purposes. Do your own DD.' },
  { title: 'Be Respectful', desc: 'Disagree with ideas, not people. No personal attacks.' },
  { title: 'No Pump & Dump', desc: 'No shilling tickers or coordinating buys. Instant ban.' },
  { title: 'Share Honestly', desc: 'Post your losses too. We learn more from red days.' },
  { title: 'Stay On Topic', desc: 'Keep channels focused. Off-topic goes in #general.' },
];

/* ─── component ─────────────────────────────────────────── */
export default function CommunityHub() {
  const [copied, setCopied] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);

  /* pull live member count from invite API */
  useEffect(() => {
    fetch(`https://discord.com/api/v10/invites/6RPsREggYV?with_counts=true`)
      .then((r) => r.json())
      .then((d) => {
        if (d.approximate_member_count != null) {
          setServerInfo({
            members: d.approximate_member_count,
            online: d.approximate_presence_count,
            name: d.guild?.name || 'Stratify',
          });
        }
      })
      .catch(() => {});
  }, []);

  const copyInvite = useCallback(() => {
    navigator.clipboard.writeText(DISCORD_INVITE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#5865F2]/20 via-indigo-500/10 to-purple-500/10 p-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#5865F2]/15 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <svg width="28" height="22" viewBox="0 0 71 55" fill="none" className="text-[#5865F2]">
                <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.3046 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3## 44.2785 53.4خ31 44.2898 53.5002 44.3433C53.8556 44.6363 54.2279 44.9293 54.6029 45.2082C54.7316 45.304 54.7232 45.5041 54.5833 45.5858C52.8146 46.6168 50.9## 47.4931 49.0خ21 48.2228C48.8762 48.2707 48.8202 48.4172 48.8818 48.5383C49.9خ84 50.6034 51.1خ30 52.5699 52.4خ59 54.4350C52.5خ23 54.5139 52.6خ26 54.5765 52.6خ78 54.5195C58.4خ68 52.7249 64.3خ22 50.0174 70.3خ79 45.5576C70.4خ33 45.5182 70.4خ69 45.4590 70.4خ97 45.3942C71.9خ73 29.9898 67.9خ89 16.6424 60.1खा45 4.9795C60.0खा49 4.9429 60.01خا37 4.9147 60.1खा045 4.8978Z" fill="currentColor"/>
              </svg>
              <h1 className="text-2xl font-bold text-white">Stratify Community</h1>
            </div>
            <p className="max-w-lg text-sm text-zinc-400">
              Join the conversation. Share trade setups, strategies, P&amp;L screenshots, and ideas to make Stratify better.
            </p>
            {serverInfo && (
              <div className="mt-3 flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <Users className="h-3.5 w-3.5" />
                  {serverInfo.members} member{serverInfo.members !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {serverInfo.online} online
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={copyInvite}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/10"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Invite'}
            </button>
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#5865F2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4752C4]"
            >
              Join Discord
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Channels — takes 2 cols */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#0b1220] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            <Hash className="h-4 w-4" />
            Channels
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon;
              return (
                <a
                  key={ch.name}
                  href={DISCORD_INVITE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-[#5865F2]/30 hover:bg-[#5865F2]/5"
                >
                  <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${ch.color}`} />
                  <div>
                    <p className="text-sm font-medium text-zinc-200 group-hover:text-white">#{ch.name}</p>
                    <p className="text-xs text-zinc-500">{ch.desc}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Rules */}
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              <Shield className="h-3.5 w-3.5 text-amber-400" />
              Rules
            </h3>
            <div className="space-y-2.5">
              {RULES.map((r, i) => (
                <div key={i} className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-400">{i + 1}</span>
                  <div>
                    <p className="text-xs font-medium text-zinc-300">{r.title}</p>
                    <p className="text-[11px] text-zinc-600">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Quick Links</h3>
            <div className="space-y-1">
              <a href="https://stratify.associates" target="_blank" rel="noopener" className="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-indigo-400">
                <span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" />Stratify App</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </a>
              <a href="https://github.com/jtdesign7277-source" target="_blank" rel="noopener" className="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-indigo-400">
                <span className="flex items-center gap-2"><Hash className="h-3.5 w-3.5" />GitHub</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </a>
              <a href={DISCORD_INVITE} target="_blank" rel="noopener" className="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-indigo-400">
                <span className="flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5" />Discord Server</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Invite Card */}
          <div className="rounded-2xl border border-[#5865F2]/20 bg-[#5865F2]/5 p-4 text-center">
            <p className="mb-2 text-sm font-medium text-zinc-300">Share with traders</p>
            <div className="mb-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-mono text-zinc-400 select-all">
              {DISCORD_INVITE}
            </div>
            <button
              onClick={copyInvite}
              className="w-full rounded-lg bg-[#5865F2] py-2 text-sm font-semibold text-white transition hover:bg-[#4752C4]"
            >
              {copied ? '✓ Copied!' : 'Copy Invite Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
