'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

const SECTIONS = [
  {
    title: '🏗 Architecture',
    items: [
      'Frontend: React + Vite + TailwindCSS on Vercel (stratify-eight.vercel.app)',
      'Backend: Node.js/Express server',
      'Database: Supabase PostgreSQL with RLS',
      'Brokerage: Alpaca API',
      'Domain: stratify.associates',
    ],
  },
  {
    title: '🎨 UI Rules (PERMANENT)',
    items: [
      'NO pill/bubble backgrounds on buttons — just plain colored text',
      'NO green box buttons — minimal/outline style only',
      'Icons: outline only, fill="none" stroke={color} strokeWidth={1.5}',
      'Exception: Folder icon gets fillOpacity={0.2}',
      'Design direction: "premium, alive, animated, modern, dark"',
      'Base colors: bg-[#0b0b0b], border-[#1f1f1f]',
    ],
  },
  {
    title: '⚙️ Tech Stack',
    items: [
      'React 19, Vite 5, TailwindCSS, Recharts, Lucide React, Supabase JS v2',
      'Helpers: formatCurrency, formatSignedCurrency, formatSigned, normalizePercent',
      'Colors: Positive = text-emerald-400, Negative = text-red-400',
    ],
  },
  {
    title: '🔄 Data Flow',
    items: [
      'Alpaca API → server/src/services/alpaca.js → getAccount(), getPositions()',
      'Frontend computes: marketValue, unrealizedPL, dailyChange',
      'Supabase persists: watchlists, alerts, strategies, snapshots',
    ],
  },
  {
    title: '🚨 Critical Rules',
    items: [
      'Never deploy from local — GitHub pushes only',
      'Never use mock data — always real',
      'Never use polling for market data — Alpaca WebSocket only',
      'Stripe: Stratify Pro @ $9.99/mo (live)',
    ],
  },
  {
    title: '🗄 Database Tables',
    items: [
      'profiles, watchlists, watchlist_items, connected_brokers, positions, trades, alerts, strategies, account_snapshots',
    ],
  },
  {
    title: '📁 Repos',
    items: [
      'Stratify: ~/Desktop/stratify/ → stratify-eight.vercel.app',
      'Second Brain: ~/Desktop/second-brain/ → second-brain-beige-gamma.vercel.app',
      'Mission Control: ~/Documents/New project/mission-control/ → mission-control-seven-henna.vercel.app',
      'Mobile App: ~/Desktop/Mobile_2nd_BRAIN/',
    ],
  },
];

function CollapsibleSection({ title, items }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border border-white/10 bg-black/30">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-zinc-100 hover:bg-white/5 transition rounded-xl"
      >
        {open ? <ChevronDown className="h-4 w-4 text-zinc-400" /> : <ChevronRight className="h-4 w-4 text-zinc-400" />}
        {title}
      </button>
      {open && (
        <ul className="space-y-1.5 px-4 pb-3 pl-10">
          {items.map((item, i) => (
            <li key={i} className="text-xs text-zinc-400 leading-relaxed">
              • {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function BrainDump() {
  const [copied, setCopied] = useState(false);

  const copyAll = useCallback(() => {
    const text = SECTIONS.map((section) => {
      const header = section.title;
      const bullets = section.items.map((item) => `- ${item}`).join('\n');
      return `## ${header}\n${bullets}`;
    }).join('\n\n');

    const full = `# Brain Dump — Stratify Reference\n\n${text}`;
    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-50">
          🧠 Brain Dump — Stratify Reference
        </h2>
        <button
          type="button"
          onClick={copyAll}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/5 transition"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied!' : 'Copy All'}
        </button>
      </div>
      <div className="space-y-2">
        {SECTIONS.map((section) => (
          <CollapsibleSection key={section.title} title={section.title} items={section.items} />
        ))}
      </div>
    </section>
  );
}
