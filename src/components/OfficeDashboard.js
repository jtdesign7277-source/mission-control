'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Briefcase, Send, Eye, RefreshCw, CheckCircle, XCircle,
  Zap, Clock, Sun, Moon, Target, Activity, Flame, BarChart2,
  Calendar, TrendingUp, MessageSquare, Sparkles, ChevronRight,
  ExternalLink, Twitter, Hash, ArrowRight, Play, Pause,
  AlertTriangle, Radio
} from 'lucide-react';

// ─── Content Types ─────────────────────────────────────────
const CONTENT_TYPES = [
  { id: 'morning-briefing',  label: 'Morning Briefing',   icon: Sun,        time: '8:30 AM',   color: '#3b82f6' },
  { id: 'technical-setup',   label: 'Technical Setup',    icon: Target,     time: 'Multiple',  color: '#10b981' },
  { id: 'top-movers',        label: 'Top Movers',         icon: TrendingUp, time: '10:00 AM',  color: '#f59e0b' },
  { id: 'midday-update',     label: 'Midday Update',      icon: Activity,   time: '12:30 PM',  color: '#6366f1' },
  { id: 'power-hour',        label: 'Power Hour',         icon: Flame,      time: '3:00 PM',   color: '#ef4444' },
  { id: 'market-recap',      label: 'Market Recap',       icon: BarChart2,  time: '4:15 PM',   color: '#8b5cf6' },
  { id: 'afterhours-movers', label: 'AH Movers',          icon: Moon,       time: '5:00 PM',   color: '#f97316' },
  { id: 'weekend-watchlist',  label: 'Weekend Watchlist',  icon: Calendar,   time: 'Sat 10 AM', color: '#06b6d4' },
];

// ─── Sub-tab Navigation ────────────────────────────────────
const SUB_TABS = [
  { id: 'engine', label: 'Content Engine', icon: Zap },
  { id: 'chat',   label: 'Chat',           icon: MessageSquare },
];

// ─── Highlight $TICKER in text ─────────────────────────────
function highlightTickers(text) {
  if (!text) return '';
  const parts = text.split(/(\$[A-Z]{1,5})/g);
  return parts.map((part, i) =>
    part.match(/^\$[A-Z]{1,5}$/)
      ? <span key={i} className="text-blue-400 font-mono font-medium">{part}</span>
      : part
  );
}

// ─── Tweet Preview Card ────────────────────────────────────
function TweetPreview({ text, isThread, index }) {
  return (
    <div className={`
      bg-[#060d18] border border-[#1a2538] rounded-xl p-4 transition-colors hover:border-[#2a3548]
      ${isThread && index > 0 ? 'ml-6 relative before:absolute before:left-[-13px] before:top-0 before:bottom-0 before:w-px before:bg-[#1a2538]' : ''}
    `}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/10">
          <span className="text-white text-sm font-bold">S</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-semibold text-sm">Stratify</span>
            <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-500 text-sm">@stratify_hq</span>
            {index === 0 && <span className="text-gray-600 text-xs">· just now</span>}
          </div>
          <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
            {highlightTickers(typeof text === 'string' ? text : text?.text || JSON.stringify(text))}
          </div>
          <div className="flex items-center gap-6 mt-3 text-gray-600 text-xs">
            <span className="hover:text-blue-400 cursor-pointer transition-colors">💬 0</span>
            <span className="hover:text-emerald-400 cursor-pointer transition-colors">🔄 0</span>
            <span className="hover:text-red-400 cursor-pointer transition-colors">❤️ 0</span>
            <span className="hover:text-blue-400 cursor-pointer transition-colors">📊 0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Content Engine Sub-tab ────────────────────────────────
function ContentEngineView() {
  const [selectedType, setSelectedType] = useState('technical-setup');
  const [preview, setPreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);

  const typeConfig = CONTENT_TYPES.find(t => t.id === selectedType);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setPreview(null);
    setPostResult(null);
    try {
      const res = await fetch(`https://stratifymarket.com/api/x-post?type=${selectedType}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setPreview(data);
    } catch (err) {
      setPreview({ error: err.message });
    } finally {
      setGenerating(false);
    }
  }, [selectedType]);

  const handlePost = useCallback(async () => {
    if (!preview?.content) return;
    setPosting(true);
    try {
      const res = await fetch(`https://stratifymarket.com/api/x-post?type=${selectedType}&post=true`);
      const data = await res.json();
      setPostResult(data);
      if (data.tweetCount > 0) {
        setRecentPosts(prev => [{
          type: selectedType,
          time: new Date().toLocaleTimeString(),
          count: data.tweetCount,
        }, ...prev].slice(0, 10));
      }
    } catch (err) {
      setPostResult({ error: err.message });
    } finally {
      setPosting(false);
    }
  }, [preview, selectedType]);

  // Get tweets array from preview content
  const getTweets = (content) => {
    if (!content) return [];
    if (Array.isArray(content)) return content;
    if (content.thread) return [content.tweet, ...content.thread];
    if (content.tweet) return [content.tweet];
    return [JSON.stringify(content)];
  };

  return (
    <div className="flex h-full">
      {/* Left: Content Type Selector */}
      <div className="w-56 border-r border-[#1a2538] flex flex-col bg-[#0a1628]/30">
        <div className="px-4 py-3 border-b border-[#1a2538]">
          <div className="flex items-center gap-2">
            <Twitter size={14} strokeWidth={1.5} className="text-blue-400" />
            <span className="text-gray-300 text-xs font-medium tracking-wide uppercase">@stratify_hq</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {CONTENT_TYPES.map(type => {
            const Icon = type.icon;
            const isActive = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => { setSelectedType(type.id); setPreview(null); setPostResult(null); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left group ${
                  isActive
                    ? 'bg-[#0f1d32] text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#0f1d32]/50'
                }`}
              >
                <Icon size={14} strokeWidth={1.5} style={isActive ? { color: type.color } : {}} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs">{type.label}</div>
                </div>
                <span className="text-gray-600 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                  {type.time}
                </span>
              </button>
            );
          })}
        </div>

        {/* Recent Activity */}
        {recentPosts.length > 0 && (
          <div className="border-t border-[#1a2538] p-3">
            <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">Recent</div>
            {recentPosts.slice(0, 3).map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] text-gray-500 py-0.5">
                <CheckCircle size={8} className="text-emerald-500" />
                <span>{p.type}</span>
                <span className="ml-auto">{p.time}</span>
              </div>
            ))}
          </div>
        )}

        {/* Cron Status */}
        <div className="px-4 py-2.5 border-t border-[#1a2538]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-[10px]">Cron active · 10 posts/day</span>
          </div>
        </div>
      </div>

      {/* Right: Preview & Actions */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Action Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a2538]">
          <div className="flex items-center gap-3">
            {typeConfig && (
              <>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${typeConfig.color}15` }}>
                  <typeConfig.icon size={14} strokeWidth={1.5} style={{ color: typeConfig.color }} />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{typeConfig.label}</div>
                  <div className="text-gray-500 text-[10px]">Generate → Preview → Post to X</div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                generating
                  ? 'bg-[#1a2538] text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20'
              }`}
            >
              {generating ? (
                <RefreshCw size={12} strokeWidth={1.5} className="animate-spin" />
              ) : (
                <Eye size={12} strokeWidth={1.5} />
              )}
              {generating ? 'Generating...' : 'Preview'}
            </button>
            <button
              onClick={handlePost}
              disabled={!preview?.content || posting}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !preview?.content || posting
                  ? 'bg-[#1a2538] text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20'
              }`}
            >
              {posting ? (
                <RefreshCw size={12} strokeWidth={1.5} className="animate-spin" />
              ) : (
                <Send size={12} strokeWidth={1.5} />
              )}
              {posting ? 'Posting...' : 'Post to X'}
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1 overflow-y-auto p-5">
          {!preview && !generating && (
            <div className="flex flex-col items-center justify-center h-full text-gray-600">
              <div className="w-12 h-12 rounded-2xl bg-[#0f1d32] flex items-center justify-center mb-3">
                <Sparkles size={20} strokeWidth={1} className="text-gray-600" />
              </div>
              <p className="text-sm text-gray-400">Click Preview to generate content</p>
              <p className="text-xs text-gray-600 mt-1">Powered by Claude AI for @stratify_hq</p>
            </div>
          )}

          {generating && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
                <RefreshCw size={18} strokeWidth={1.5} className="animate-spin text-blue-400" />
              </div>
              <p className="text-gray-400 text-sm">Generating {typeConfig?.label}...</p>
            </div>
          )}

          {preview?.error && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-400">
                <XCircle size={14} strokeWidth={1.5} />
                <span className="text-sm font-medium">Failed</span>
              </div>
              <p className="text-red-400/70 text-xs mt-1">{preview.error}</p>
            </div>
          )}

          {preview?.content && (
            <div className="space-y-3 max-w-lg">
              {/* Technical setup extra data */}
              {!Array.isArray(preview.content) && preview.content.entry && (
                <div className="bg-[#0a1628] border border-[#1a2538] rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={14} strokeWidth={1.5} className="text-emerald-400" />
                    <span className="text-white text-sm font-medium">Setup Details</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Entry', value: `$${preview.content.entry}`, color: 'text-white' },
                      { label: 'Stop', value: `$${preview.content.stop}`, color: 'text-red-400' },
                      { label: 'Target', value: `$${preview.content.target}`, color: 'text-emerald-400' },
                      { label: 'R:R', value: preview.content.rr_ratio, color: 'text-blue-400' },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="text-gray-500 text-[10px] uppercase tracking-wider">{label}</div>
                        <div className={`${color} font-mono text-sm mt-0.5`}>{value}</div>
                      </div>
                    ))}
                  </div>
                  {preview.content.chartUrl && (
                    <a href={preview.content.chartUrl} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-1.5 text-blue-400 text-xs mt-3 hover:text-blue-300 transition-colors">
                      <ExternalLink size={10} strokeWidth={1.5} />
                      View on TradingView
                    </a>
                  )}
                </div>
              )}

              {/* Tweet previews */}
              {getTweets(preview.content).map((tweet, i) => (
                <TweetPreview
                  key={i}
                  text={tweet}
                  isThread={getTweets(preview.content).length > 1}
                  index={i}
                />
              ))}
            </div>
          )}

          {/* Post result */}
          {postResult && (
            <div className={`mt-4 p-4 rounded-xl border ${
              postResult.error
                ? 'bg-red-500/5 border-red-500/20'
                : 'bg-emerald-500/5 border-emerald-500/20'
            }`}>
              <div className="flex items-center gap-2">
                {postResult.error ? (
                  <XCircle size={14} strokeWidth={1.5} className="text-red-400" />
                ) : (
                  <CheckCircle size={14} strokeWidth={1.5} className="text-emerald-400" />
                )}
                <span className={`text-sm font-medium ${postResult.error ? 'text-red-400' : 'text-emerald-400'}`}>
                  {postResult.error ? 'Post Failed' : `Posted ${postResult.tweetCount || 0} tweet(s)`}
                </span>
              </div>
              {postResult.error && <p className="text-red-400/60 text-xs mt-1">{postResult.error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Chat Sub-tab ──────────────────────────────────────────
function ChatView() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to the Stratify Office. I can help you manage content, review analytics, draft tweets, or brainstorm marketing strategies. What would you like to work on?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are Stratify's marketing and content assistant inside Mission Control. You help with:
- Drafting tweets for @stratify_hq
- Brainstorming marketing strategies
- Reviewing content performance
- Planning social media campaigns
- Writing copy for the platform
Keep responses concise and actionable. Use trading/fintech language naturally.`,
          messages: messages.filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0).concat([
            { role: 'user', content: userMsg }
          ]),
        }),
      });

      const data = await res.json();
      const reply = data.content?.[0]?.text || 'Sorry, something went wrong.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-[#0a1628] border border-[#1a2538] text-gray-200'
            }`}>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {highlightTickers(msg.content)}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#0a1628] border border-[#1a2538] rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-[#1a2538] p-4">
        <div className="flex items-center gap-3 bg-[#0a1628] border border-[#1a2538] rounded-xl px-4 py-2.5 focus-within:border-blue-500/50 transition-colors">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Draft a tweet, plan a campaign, brainstorm ideas..."
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className={`p-1.5 rounded-lg transition-colors ${
              input.trim() && !loading
                ? 'text-blue-400 hover:bg-blue-500/10'
                : 'text-gray-600'
            }`}
          >
            <Send size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Office Dashboard ─────────────────────────────────
export default function OfficeDashboard() {
  const [activeTab, setActiveTab] = useState('engine');

  return (
    <div className="flex flex-col h-full bg-[#060d18] rounded-xl overflow-hidden border border-[#1a2538]">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[#1a2538] bg-[#0a1628]/50">
        <Briefcase size={14} strokeWidth={1.5} className="text-blue-400 mr-2" />
        <span className="text-white text-sm font-medium mr-4">The Office</span>
        {SUB_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#0f1d32] text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#0f1d32]/50'
              }`}
            >
              <Icon size={12} strokeWidth={1.5} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'engine' && <ContentEngineView />}
        {activeTab === 'chat' && <ChatView />}
      </div>
    </div>
  );
}
