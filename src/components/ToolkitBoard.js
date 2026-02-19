'use client';

import { useState, useMemo } from 'react';
import { ExternalLink, Search, Package, Star, ChevronDown, ChevronRight } from 'lucide-react';

const TOOLKIT = [
  {
    category: '📊 Financial / Trading',
    items: [
      { name: 'TradingView Widgets', desc: 'Charts, tickers, heatmaps, screeners, market overview', url: 'https://www.tradingview.com/widget/', status: 'installed', tags: ['charts', 'trading', 'embed'] },
      { name: 'TradingView Lightweight Charts', desc: 'Self-hosted candlestick, line, area chart library', url: 'https://github.com/nicehash/lightweight-charts', status: 'installed', tags: ['charts', 'npm'] },
      { name: 'Financial Modeling Prep Widgets', desc: 'Stock cards, financials, earnings calendars', url: 'https://site.financialmodelingprep.com/widgets', status: 'available', tags: ['data', 'embed'] },
      { name: 'Stock Analysis Widget', desc: 'Earnings, financials, quote cards', url: 'https://stockanalysis.com/widgets/', status: 'available', tags: ['data', 'embed'] },
      { name: 'CoinGecko Widgets', desc: 'Crypto price tickers, charts, coin lists', url: 'https://www.coingecko.com/en/widgets', status: 'available', tags: ['crypto', 'embed'] },
      { name: 'TradingLite', desc: 'Heatmaps, order flow visualization', url: 'https://www.tradinglite.com/', status: 'available', tags: ['charts', 'trading'] },
    ],
  },
  {
    category: '📰 News / Content',
    items: [
      { name: 'Feedwind', desc: 'RSS feed widget — embed any news feed', url: 'https://feed.mikle.com/', status: 'available', tags: ['rss', 'embed'] },
      { name: 'Curator.io', desc: 'Social media feed aggregator (X, IG, etc.)', url: 'https://curator.io/', status: 'available', tags: ['social', 'embed'] },
      { name: 'NewsAPI', desc: 'JSON news API, build your own feed', url: 'https://newsapi.org/', status: 'available', tags: ['api', 'news'] },
      { name: 'Tagembed', desc: 'Embed social feeds (X, YouTube, reviews)', url: 'https://tagembed.com/', status: 'available', tags: ['social', 'embed'] },
    ],
  },
  {
    category: '🏀 Sports',
    items: [
      { name: 'ESPN API', desc: 'Free scoreboard JSON — live scores', url: 'https://site.api.espn.com/apis/site/v2/sports/', status: 'installed', tags: ['api', 'sports'] },
      { name: 'SofaScore Widget', desc: 'Live scores embed', url: 'https://www.sofascore.com/widgets', status: 'available', tags: ['sports', 'embed'] },
      { name: 'Sportradar Widgets', desc: 'Premium sports data widgets', url: 'https://sportradar.com/', status: 'available', tags: ['sports', 'premium'] },
    ],
  },
  {
    category: '💬 Chat / Communication',
    items: [
      { name: 'Tawk.to', desc: 'Free live chat widget, drop-in', url: 'https://www.tawk.to/', status: 'available', tags: ['chat', 'embed'] },
      { name: 'Crisp', desc: 'Chat widget with free tier', url: 'https://crisp.chat/', status: 'available', tags: ['chat', 'embed'] },
      { name: 'Intercom', desc: 'Chat + support (paid but polished)', url: 'https://www.intercom.com/', status: 'available', tags: ['chat', 'premium'] },
    ],
  },
  {
    category: '🔔 Notifications / Alerts',
    items: [
      { name: 'Notistack', desc: 'React toast/snackbar notifications', url: 'https://github.com/iamhosseindhv/notistack', status: 'available', tags: ['react', 'npm'] },
      { name: 'React Hot Toast', desc: 'Lightweight toast library', url: 'https://github.com/timolins/react-hot-toast', status: 'available', tags: ['react', 'npm'] },
      { name: 'Sonner', desc: 'Beautiful toast component', url: 'https://github.com/emilkowalski/sonner', status: 'available', tags: ['react', 'npm'] },
    ],
  },
  {
    category: '📈 Analytics / Dashboards',
    items: [
      { name: 'Tremor', desc: 'React dashboard components (charts, KPIs, tables)', url: 'https://github.com/tremorlabs/tremor', status: 'available', tags: ['react', 'dashboard'] },
      { name: 'Recharts', desc: 'React charting library', url: 'https://recharts.org/', status: 'installed', tags: ['react', 'charts'] },
      { name: 'Nivo', desc: 'Beautiful React data visualization', url: 'https://github.com/plouc/nivo', status: 'available', tags: ['react', 'charts'] },
      { name: 'ApexCharts', desc: 'Interactive charts, free', url: 'https://github.com/apexcharts/react-apexcharts', status: 'available', tags: ['react', 'charts'] },
    ],
  },
  {
    category: '🗺️ Maps / Weather',
    items: [
      { name: 'Mapbox GL', desc: 'Interactive maps, free tier', url: 'https://github.com/mapbox/mapbox-gl-js', status: 'available', tags: ['maps', 'npm'] },
      { name: 'Leaflet', desc: 'Lightweight open-source maps', url: 'https://github.com/Leaflet/Leaflet', status: 'available', tags: ['maps', 'npm'] },
      { name: 'Open-Meteo', desc: 'Free weather API — no key required', url: 'https://open-meteo.com/', status: 'installed', tags: ['api', 'weather'] },
    ],
  },
  {
    category: '🎨 UI Components',
    items: [
      { name: 'shadcn/ui', desc: 'Copy-paste React components, works with Tailwind', url: 'https://github.com/shadcn-ui/ui', status: 'available', tags: ['react', 'ui'] },
      { name: 'Radix UI', desc: 'Headless accessible components', url: 'https://github.com/radix-ui/primitives', status: 'available', tags: ['react', 'ui'] },
      { name: 'Framer Motion', desc: 'Animations and transitions', url: 'https://github.com/framer/motion', status: 'available', tags: ['react', 'animation'] },
      { name: 'cmdk', desc: 'Command palette (⌘K) — like Spotlight/VS Code', url: 'https://github.com/pacocoursey/cmdk', status: 'available', tags: ['react', 'ui'] },
    ],
  },
  {
    category: '🔌 WebSockets / Real-time',
    items: [
      { name: 'Socket.IO', desc: '62k+ stars, auto-reconnect, rooms, fallback to polling', url: 'https://github.com/socketio/socket.io', status: 'available', tags: ['websocket', 'npm'] },
      { name: 'ws', desc: 'Raw Node.js WebSocket library, lightweight', url: 'https://github.com/websockets/ws', status: 'available', tags: ['websocket', 'npm'] },
      { name: 'PartyKit', desc: 'Edge WebSockets, built for Vercel-style deployments', url: 'https://github.com/partykit/partykit', status: 'available', tags: ['websocket', 'edge'] },
      { name: 'Supabase Realtime', desc: 'Built-in WebSocket channels — already in your stack', url: 'https://supabase.com/docs/guides/realtime', status: 'installed', tags: ['websocket', 'supabase'] },
      { name: 'Ably', desc: 'Managed real-time, free tier (6M messages/mo)', url: 'https://github.com/ably/ably-js', status: 'available', tags: ['websocket', 'managed'] },
      { name: 'Pusher', desc: 'Managed real-time, free tier available', url: 'https://github.com/pusher/pusher-js', status: 'available', tags: ['websocket', 'managed'] },
    ],
  },
];

const STATUS_STYLES = {
  installed: { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400', label: 'Installed' },
  available: { bg: 'bg-zinc-500/10 border-white/10', text: 'text-zinc-400', label: 'Available' },
};

export default function ToolkitBoard() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | installed | available
  const [expandedCats, setExpandedCats] = useState(new Set(TOOLKIT.map((c) => c.category)));

  const toggleCat = (cat) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return TOOLKIT.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        if (filter === 'installed' && item.status !== 'installed') return false;
        if (filter === 'available' && item.status !== 'available') return false;
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          item.tags.some((t) => t.includes(q))
        );
      }),
    })).filter((cat) => cat.items.length > 0);
  }, [search, filter]);

  const totalInstalled = TOOLKIT.reduce((sum, cat) => sum + cat.items.filter((i) => i.status === 'installed').length, 0);
  const totalAvailable = TOOLKIT.reduce((sum, cat) => sum + cat.items.filter((i) => i.status === 'available').length, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Package className="h-5 w-5 text-purple-400" />
          Toolkit — Things to Work On
        </h2>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" />{totalInstalled} installed</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-zinc-500" />{totalAvailable} available</span>
        </div>
      </div>

      {/* Search + filter */}
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search widgets, libraries, APIs..."
            className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500/40"
          />
        </div>
        <div className="flex gap-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'installed', label: 'Installed' },
            { id: 'available', label: 'Available' },
          ].map((f) => (
            <button key={f.id} type="button" onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-2 text-xs transition ${filter === f.id ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {filtered.map((cat) => {
          const isOpen = expandedCats.has(cat.category);
          return (
            <div key={cat.category} className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
              <button type="button" onClick={() => toggleCat(cat.category)}
                className="flex w-full items-center justify-between px-4 py-3 hover:bg-white/5 transition">
                <span className="text-sm font-semibold text-zinc-100">{cat.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">{cat.items.length} items</span>
                  {isOpen ? <ChevronDown className="h-4 w-4 text-zinc-500" /> : <ChevronRight className="h-4 w-4 text-zinc-500" />}
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-white/5 px-2 pb-2">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                    {cat.items.map((item) => {
                      const style = STATUS_STYLES[item.status] || STATUS_STYLES.available;
                      return (
                        <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
                          className={`group rounded-lg border p-3 transition hover:bg-white/5 hover:border-white/20 ${style.bg}`}>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-medium text-zinc-100 group-hover:text-emerald-300 transition">{item.name}</h3>
                            <ExternalLink className="h-3 w-3 shrink-0 text-zinc-600 group-hover:text-emerald-400 mt-0.5" />
                          </div>
                          <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex gap-1 flex-wrap">
                              {item.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="rounded px-1.5 py-0.5 text-[10px] bg-white/5 text-zinc-500">{tag}</span>
                              ))}
                            </div>
                            <span className={`text-[10px] font-medium uppercase tracking-wider ${style.text}`}>{style.label}</span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
            <p className="text-sm text-zinc-500">No matches found</p>
          </div>
        )}
      </div>
    </div>
  );
}
