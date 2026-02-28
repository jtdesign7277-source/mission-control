'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Briefcase, Send, Eye, RefreshCw, CheckCircle, XCircle,
  Zap, Clock, Sun, Moon, Target, Activity, Flame, BarChart2,
  Calendar, TrendingUp, MessageSquare, Sparkles, ChevronRight,
  ExternalLink, Twitter, Hash, ArrowRight, Play, Pause,
  AlertTriangle, Radio, Loader2
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

// ─── Highlight $TICKER in text ─────────────────────────────
function highlightTickers(text) {
  if (!text) return '';
  const parts = String(text).split(/(\$[A-Z]{1,5})/g);
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

// ─── Feed Card (Left Panel) ────────────────────────────────
function FeedCard({ type, data, isSelected, onClick }) {
  const config = CONTENT_TYPES.find(t => t.id === type);
  if (!config) return null;
  const Icon = config.icon;

  const getTweets = (content) => {
    if (!content) return [];
    if (Array.isArray(content)) return content;
    if (content.thread) return [content.tweet, ...content.thread];
    if (content.tweet) return [content.tweet];
    return [];
  };

  const tweets = data?.content ? getTweets(data.content) : [];
  const firstTweet = tweets[0] || '';
  const preview = typeof firstTweet === 'string'
    ? firstTweet.slice(0, 120) + (firstTweet.length > 120 ? '...' : '')
    : '';

  const timeAgo = data?.generatedAt
    ? getTimeAgo(new Date(data.generatedAt))
    : null;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all group ${
        isSelected
          ? 'bg-[#0f1d32] border-blue-500/30'
          : 'bg-[#0a1628]/40 border-[#1a2538] hover:bg-[#0f1d32]/60 hover:border-[#2a3548]'
      }`}
    >
      <div className="flex items-center gap-2.5 mb-1.5">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${config.color}15` }}
        >
          <Icon size={12} strokeWidth={1.5} style={{ color: config.color }} />
        </div>
        <span className="text-white text-sm font-medium flex-1 truncate">{config.label}</span>
        {data?.content ? (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
            data.fromCache
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-blue-500/10 text-blue-400'
          }`}>
            {data.fromCache ? 'Cached' : 'Fresh'}
          </span>
        ) : (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-500/10 text-gray-500 font-medium">
            Pending
          </span>
        )}
      </div>
      {preview ? (
        <p className="text-gray-300 text-xs leading-relaxed line-clamp-2 ml-8">
          {preview}
        </p>
      ) : (
        <p className="text-gray-500 text-xs ml-8 italic">Click to generate</p>
      )}
      {timeAgo && (
        <div className="flex items-center gap-1.5 mt-1.5 ml-8">
          <Clock size={9} className="text-gray-600" />
          <span className="text-gray-500 text-[11px]">{timeAgo}</span>
          {tweets.length > 1 && (
            <span className="text-gray-600 text-[9px]">· {tweets.length} tweets</span>
          )}
        </div>
      )}
    </button>
  );
}

function getTimeAgo(date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Chat View ─────────────────────────────────────────────

// ─── Compose View (Write & Post Custom Tweet) ──────────────
function ComposeView() {
  const [tweetText, setTweetText] = useState('');
  const [postingTweet, setPostingTweet] = useState(false);
  const [postStatus, setPostStatus] = useState(null);
  const charLimit = 280;
  const charCount = tweetText.length;
  const isOverLimit = charCount > charLimit;

  const handlePostTweet = async () => {
    if (!tweetText.trim() || isOverLimit || postingTweet) return;
    setPostingTweet(true);
    setPostStatus(null);
    try {
      const res = await fetch('https://stratifymarket.com/api/x-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweet: tweetText.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPostStatus({ success: true, message: 'Posted to X!' });
      setTweetText('');
    } catch (err) {
      setPostStatus({ success: false, message: err.message });
    } finally {
      setPostingTweet(false);
    }
  };

  const openInX = () => {
    const encoded = encodeURIComponent(tweetText);
    window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <div>
            <div className="text-white text-sm font-medium">Stratify</div>
            <div className="text-gray-500 text-[10px]">@stratify_hq</div>
          </div>
        </div>
        <textarea
          value={tweetText}
          onChange={e => setTweetText(e.target.value)}
          placeholder="What's happening in the markets?"
          className="w-full h-40 bg-[#060d18] border border-[#1a2538] rounded-xl p-3 text-gray-200 text-sm placeholder-gray-600 outline-none resize-none focus:border-blue-500/50 transition-colors"
        />
        <div className="flex items-center justify-between mt-2">
          <span className={`text-[10px] font-mono ${isOverLimit ? 'text-red-400' : charCount > 250 ? 'text-amber-400' : 'text-gray-600'}`}>
            {charCount}/{charLimit}
          </span>
          {postStatus && (
            <span className={`text-[10px] ${postStatus.success ? 'text-emerald-400' : 'text-red-400'}`}>
              {postStatus.message}
            </span>
          )}
        </div>
      </div>
      <div className="border-t border-[#1a2538] p-3 flex items-center justify-end gap-2">
        <button
          onClick={openInX}
          disabled={!tweetText.trim()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            tweetText.trim() ? 'text-blue-400 hover:bg-blue-500/10 border border-blue-500/20' : 'text-gray-600 border border-[#1a2538]'
          }`}
        >
          <ExternalLink size={11} strokeWidth={1.5} />
          Open in X
        </button>
        <button
          onClick={handlePostTweet}
          disabled={!tweetText.trim() || isOverLimit || postingTweet}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
            tweetText.trim() && !isOverLimit && !postingTweet
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-[#1a2538] text-gray-500 cursor-not-allowed'
          }`}
        >
          {postingTweet ? <RefreshCw size={11} className="animate-spin" /> : <Send size={11} strokeWidth={1.5} />}
          {postingTweet ? 'Posting...' : 'Post to X'}
        </button>
      </div>
    </div>
  );
}

function ChatView() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hey! I'm your Stratify content assistant. I can help you draft tweets, brainstorm marketing strategies, analyze setups, or plan campaigns for @stratify_hq. What are you working on?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1000,
          system: `You are Stratify's marketing and content assistant inside Mission Control. You help with:
- Drafting tweets for @stratify_hq
- Brainstorming marketing strategies
- Reviewing content performance
- Planning social media campaigns
- Writing copy for the platform
- Analyzing technical setups and trade ideas
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-[#0a1628] border border-[#1a2538] text-gray-200'
            }`}>
              <div className="text-xs leading-relaxed whitespace-pre-wrap">
                {highlightTickers(msg.content)}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#0a1628] border border-[#1a2538] rounded-xl px-3.5 py-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="border-t border-[#1a2538] p-3">
        <div className="flex items-center gap-2 bg-[#0a1628] border border-[#1a2538] rounded-lg px-3 py-2 focus-within:border-blue-500/50 transition-colors">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask about strategies, draft tweets..."
            className="flex-1 bg-transparent text-white text-xs placeholder-gray-500 outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className={`p-1 rounded-md transition-colors ${
              input.trim() && !loading ? 'text-blue-400 hover:bg-blue-500/10' : 'text-gray-600'
            }`}
          >
            <Send size={12} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Office Dashboard (Split Screen) ──────────────────
export default function OfficeDashboard() {
  const [feedData, setFeedData] = useState({});
  const [selectedType, setSelectedType] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState(null);
  const [rightTab, setRightTab] = useState('preview');
  const [loadingFeed, setLoadingFeed] = useState(true);

  // Get tweets array from content
  const getTweets = (content) => {
    if (!content) return [];
    if (Array.isArray(content)) return content;
    if (content.thread) return [content.tweet, ...content.thread];
    if (content.tweet) return [content.tweet];
    return [typeof content === 'string' ? content : JSON.stringify(content)];
  };

  // Load all cached content on mount
  useEffect(() => {
    async function loadFeed() {
      setLoadingFeed(true);
      const results = await Promise.allSettled(
        CONTENT_TYPES.map(async (type) => {
          const res = await fetch(`/api/generate-content?type=${type.id}&cacheOnly=true`);
          if (!res.ok) return { type: type.id, data: null };
          const data = await res.json();
          return { type: type.id, data };
        })
      );

      const newFeed = {};
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.data?.content) {
          newFeed[result.value.type] = result.value.data;
        }
      });
      setFeedData(newFeed);
      setLoadingFeed(false);
    }
    loadFeed();

    // Refresh every 5 minutes
    const interval = setInterval(loadFeed, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate/refresh a specific type
  const handleGenerate = useCallback(async (type, forceRefresh = false) => {
    setGenerating(true);
    setPostResult(null);
    try {
      const url = `/api/generate-content?type=${type}${forceRefresh ? '&refresh=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setFeedData(prev => ({ ...prev, [type]: data }));
      setSelectedType(type);
      setRightTab('preview');
    } catch (err) {
      console.error('Generate error:', err);
    } finally {
      setGenerating(false);
    }
  }, []);

  // Post to X
  const handlePost = useCallback(async () => {
    if (!selectedType || !feedData[selectedType]?.content) return;
    setPosting(true);
    try {
      const res = await fetch(`https://stratifymarket.com/api/x-post?type=${selectedType}&post=true`);
      const data = await res.json();
      setPostResult(data);
    } catch (err) {
      setPostResult({ error: err.message });
    } finally {
      setPosting(false);
    }
  }, [selectedType, feedData]);

  const selectedData = selectedType ? feedData[selectedType] : null;
  const selectedConfig = CONTENT_TYPES.find(t => t.id === selectedType);
  const tweets = selectedData?.content ? getTweets(selectedData.content) : [];

  // Sort feed: items with content first (by generatedAt), then pending
  const sortedTypes = [...CONTENT_TYPES].sort((a, b) => {
    const aData = feedData[a.id];
    const bData = feedData[b.id];
    if (aData?.generatedAt && bData?.generatedAt) {
      return new Date(bData.generatedAt) - new Date(aData.generatedAt);
    }
    if (aData?.generatedAt) return -1;
    if (bData?.generatedAt) return 1;
    return 0;
  });

  return (
    <div className="flex flex-col h-full bg-[#060d18] rounded-xl overflow-hidden border border-[#1a2538]">
      {/* ── Header Bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a2538] bg-[#0a1628]/50">
        <div className="flex items-center gap-2">
          <Briefcase size={14} strokeWidth={1.5} className="text-blue-400" />
          <span className="text-white text-sm font-medium">The Office</span>
          <span className="text-gray-600 text-[10px] ml-1">@stratify_hq</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-[10px]">Live</span>
          <span className="text-gray-600 text-[10px] ml-2">
            {Object.keys(feedData).length}/{CONTENT_TYPES.length} cached
          </span>
        </div>
      </div>

      {/* ── Split Screen ────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ── LEFT PANEL: Content Feed (55%) ────────────────── */}
        <div className="w-[55%] flex flex-col border-r border-[#1a2538]">
          {/* Filter pills */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-[#1a2538] overflow-x-auto scrollbar-hide">
            
            {CONTENT_TYPES.map(type => {
              const hasContent = !!feedData[type.id]?.content;
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type.id);
                    setRightTab('preview');
                    if (!hasContent) handleGenerate(type.id);
                  }}
                  className={`flex-shrink-0 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                    selectedType === type.id
                      ? 'bg-[#0f1d32] text-white'
                      : hasContent
                        ? 'text-white/70 hover:text-white hover:bg-[#0f1d32]/50'
                        : 'text-gray-600 hover:text-gray-400 hover:bg-[#0f1d32]/30'
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>

          {/* Feed list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {loadingFeed ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <Loader2 size={20} className="animate-spin mb-2" />
                <span className="text-xs">Loading content feed...</span>
              </div>
            ) : (
              sortedTypes.map(type => (
                <FeedCard
                  key={type.id}
                  type={type.id}
                  data={feedData[type.id]}
                  isSelected={selectedType === type.id}
                  onClick={() => {
                    setSelectedType(type.id);
                    setRightTab('preview');
                    if (!feedData[type.id]?.content) handleGenerate(type.id);
                  }}
                />
              ))
            )}
          </div>

          {/* Cron status footer */}
          <div className="px-3 py-2 border-t border-[#1a2538] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-[9px]">Cron active · 10 posts/day</span>
            </div>
            <button
              onClick={() => {
                CONTENT_TYPES.forEach(t => {
                  if (!feedData[t.id]?.content) handleGenerate(t.id);
                });
              }}
              className="text-gray-500 hover:text-gray-300 text-[9px] flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={9} /> Generate all
            </button>
          </div>
        </div>

        {/* ── RIGHT PANEL: Preview & Chat (45%) ─────────────── */}
        <div className="w-[45%] flex flex-col min-w-0">
          {/* Right panel tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-[#1a2538]">
            <button
              onClick={() => setRightTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                rightTab === 'preview'
                  ? 'bg-[#0f1d32] text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#0f1d32]/50'
              }`}
            >
              <Eye size={11} strokeWidth={1.5} />
              Preview
            </button>
            <button
              onClick={() => setRightTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                rightTab === 'chat'
                  ? 'bg-[#0f1d32] text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#0f1d32]/50'
              }`}
            >
              <MessageSquare size={11} strokeWidth={1.5} />
              Chat
            </button>
            <button
              onClick={() => setRightTab("compose")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                rightTab === "compose"
                  ? "bg-[#0f1d32] text-white"
                  : "text-gray-400 hover:text-gray-200 hover:bg-[#0f1d32]/50"
              }`}
            >
              <Twitter size={11} strokeWidth={1.5} />
              Compose
            </button>

            {/* Action buttons (only in preview mode with content) */}
            {rightTab === 'preview' && selectedData?.content && (
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  onClick={() => handleGenerate(selectedType, true)}
                  disabled={generating}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-gray-400 hover:text-white hover:bg-[#1a2538] transition-all"
                  title="Regenerate (bypass cache)"
                >
                  <RefreshCw size={10} strokeWidth={1.5} className={generating ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={handlePost}
                  disabled={posting}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-medium transition-all ${
                    posting
                      ? 'bg-[#1a2538] text-gray-500'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {posting ? (
                    <RefreshCw size={10} className="animate-spin" />
                  ) : (
                    <Send size={10} strokeWidth={1.5} />
                  )}
                  {posting ? 'Posting...' : 'Post to X'}
                </button>
              </div>
            )}
          </div>

          {/* Right panel content */}
          <div className="flex-1 min-h-0">
            {rightTab === 'preview' ? (
              <div className="h-full overflow-y-auto">
                {generating && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-600">
                    <RefreshCw size={20} className="animate-spin mb-2 text-blue-400" />
                    <span className="text-xs">Generating with live data...</span>
                    <span className="text-[10px] text-gray-600 mt-1">Twelve Data → Claude AI</span>
                  </div>
                )}

                {!generating && tweets.length > 0 && (
                  <div className="p-4 space-y-3">
                    {/* Header */}
                    {selectedConfig && (
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${selectedConfig.color}15` }}
                        >
                          <selectedConfig.icon size={14} strokeWidth={1.5} style={{ color: selectedConfig.color }} />
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">{selectedConfig.label}</div>
                          <div className="text-gray-500 text-[10px]">
                            {selectedData?.generatedAt
                              ? `Generated ${getTimeAgo(new Date(selectedData.generatedAt))}`
                              : ''}
                            {selectedData?.fromCache && ' · from cache'}
                            {selectedData?.marketData && ` · ${selectedData.marketData}`}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Post result */}
                    {postResult && (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                        postResult.error
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {postResult.error ? (
                          <><XCircle size={12} /> {postResult.error}</>
                        ) : (
                          <><CheckCircle size={12} /> Posted {postResult.tweetCount} tweet{postResult.tweetCount > 1 ? 's' : ''} to X</>
                        )}
                      </div>
                    )}

                    {/* Tweets */}
                    {tweets.map((tweet, i) => (
                      <TweetPreview
                        key={i}
                        text={tweet}
                        isThread={tweets.length > 1}
                        index={i}
                      />
                    ))}
                  </div>
                )}

                {!generating && tweets.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-600">
                    <div className="w-12 h-12 rounded-2xl bg-[#0f1d32] flex items-center justify-center mb-3">
                      <Sparkles size={20} strokeWidth={1.5} className="text-gray-500" />
                    </div>
                    <span className="text-xs mb-1">Select a post to preview</span>
                    <span className="text-[10px] text-gray-700">
                      Or click a pending item to generate
                    </span>
                  </div>
                )}
              </div>
            ) : rightTab === 'chat' ? (
              <ChatView />
            ) : (
              <ComposeView />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
