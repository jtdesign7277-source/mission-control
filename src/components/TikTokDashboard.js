'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Copy, Check, Plus, X, Video, Loader2, Send } from 'lucide-react';

const STATUS_CONFIG = {
  generating: { emoji: '🔄', label: 'Generating', bg: 'bg-yellow-500/15', border: 'border-yellow-400/40', text: 'text-yellow-300' },
  ready:      { emoji: '✅', label: 'Ready',      bg: 'bg-emerald-500/15', border: 'border-emerald-400/40', text: 'text-emerald-300' },
  posted:     { emoji: '📤', label: 'Posted',     bg: 'bg-zinc-500/15', border: 'border-zinc-400/40', text: 'text-zinc-400' },
  failed:     { emoji: '❌', label: 'Failed',     bg: 'bg-red-500/15', border: 'border-red-400/40', text: 'text-red-300' },
};

export default function TikTokDashboard() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const pollRef = useRef(null);

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch('/api/tiktok', { cache: 'no-store' });
      const data = await res.json();
      if (data.videos) setVideos(data.videos);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  // Poll generating videos
  useEffect(() => {
    const generatingVideos = videos.filter(v => v.status === 'generating');
    if (generatingVideos.length === 0) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      for (const v of generatingVideos) {
        try {
          const res = await fetch('/api/tiktok/poll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: v.id }),
          });
          const data = await res.json();
          if (data.video && data.video.status !== 'generating') {
            setVideos(prev => prev.map(p => p.id === data.video.id ? data.video : p));
          }
        } catch {}
      }
    }, 5000);
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [videos]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/tiktok/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), style: style.trim() || undefined }),
      });
      const data = await res.json();
      if (data.video) {
        setVideos(prev => [data.video, ...prev]);
        setPrompt(''); setStyle(''); setShowForm(false);
      }
    } catch {} finally { setGenerating(false); }
  };

  const markPosted = async (id) => {
    try {
      const res = await fetch('/api/tiktok', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'posted' }),
      });
      const data = await res.json();
      if (data.video) setVideos(prev => prev.map(v => v.id === id ? data.video : v));
    } catch {}
  };

  const copyCaption = (id, caption) => {
    navigator.clipboard.writeText(caption || '');
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-pink-400" />
          <h2 className="text-lg font-semibold text-zinc-100" style={{ fontFamily: 'JetBrains Mono, monospace' }}>TikTok Videos</h2>
          <span className="text-xs text-zinc-500">{videos.length} total</span>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-pink-400/40 bg-pink-500/15 px-3 py-1.5 text-xs text-pink-300 hover:bg-pink-500/25 transition"
        >
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? 'Cancel' : 'Generate New Video'}
        </button>
      </div>

      {/* Generate Form */}
      {showForm && (
        <form onSubmit={handleGenerate} className="mb-4 rounded-xl border border-pink-400/20 bg-pink-500/5 p-4 space-y-3">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe your video... (e.g. A cinematic drone shot over a neon-lit city at night)"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-pink-400/40 focus:outline-none resize-none"
            rows={3}
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          />
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs text-zinc-500 mb-1 block">Style (optional)</label>
              <input
                value={style}
                onChange={e => setStyle(e.target.value)}
                placeholder="cinematic, anime, vlog..."
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 focus:border-pink-400/40 focus:outline-none"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              />
            </div>
            <button
              type="submit"
              disabled={generating || !prompt.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-pink-500/80 px-4 py-1.5 text-sm text-white hover:bg-pink-500 disabled:opacity-40 transition"
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading videos...
        </div>
      )}

      {/* Empty state */}
      {!loading && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <Video className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">No videos yet</p>
          <p className="text-xs mt-1">Click &quot;Generate New Video&quot; to create your first one</p>
        </div>
      )}

      {/* Video Grid */}
      {!loading && videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {videos.map(v => {
            const s = STATUS_CONFIG[v.status] || STATUS_CONFIG.generating;
            return (
              <div key={v.id} className="rounded-xl border border-white/10 bg-black/40 overflow-hidden hover:border-white/20 transition">
                {/* Thumbnail / Preview */}
                <div className="aspect-[9/16] max-h-48 bg-zinc-900 flex items-center justify-center relative overflow-hidden">
                  {v.video_url ? (
                    <video src={v.video_url} className="w-full h-full object-cover" muted loop playsInline
                      onMouseEnter={e => e.target.play()} onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
                    />
                  ) : v.thumbnail_url ? (
                    <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Video className="h-8 w-8 text-zinc-700" />
                  )}
                  {/* Status badge */}
                  <div className={`absolute top-2 right-2 flex items-center gap-1 rounded-full ${s.bg} ${s.border} border px-2 py-0.5`}>
                    <span className="text-xs">{s.emoji}</span>
                    <span className={`text-[10px] font-medium ${s.text}`}>{s.label}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <p className="text-xs text-zinc-300 line-clamp-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {v.caption || v.prompt}
                  </p>
                  {v.style && <span className="inline-block text-[10px] text-pink-400/70 bg-pink-500/10 rounded px-1.5 py-0.5">{v.style}</span>}
                  <p className="text-[10px] text-zinc-600">{fmtDate(v.created_at)}</p>

                  {/* Actions */}
                  <div className="flex gap-1.5 pt-1">
                    {v.video_url && (
                      <a href={v.video_url} download target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition">
                        <Download className="h-3 w-3" /> Download
                      </a>
                    )}
                    <button onClick={() => copyCaption(v.id, v.caption || v.prompt)}
                      className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition">
                      {copiedId === v.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copiedId === v.id ? 'Copied' : 'Caption'}
                    </button>
                    {v.status === 'ready' && (
                      <button onClick={() => markPosted(v.id)}
                        className="flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-400 hover:bg-emerald-500/20 transition">
                        <Send className="h-3 w-3" /> Posted
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
