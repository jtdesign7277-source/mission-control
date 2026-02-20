'use client';

import { useState } from 'react';
import { Search, Loader2, ExternalLink, Play, ChevronDown, ChevronUp } from 'lucide-react';

const SKILLS = [
  {
    name: 'last30days',
    version: 'v2.1',
    author: 'mvanhorn',
    description:
      'Researches any topic across Reddit, X, YouTube & web from the last 30 days. Finds what communities are actually upvoting, sharing, and saying — writes copy-paste-ready prompts that work today.',
    github: 'https://github.com/mvanhorn/last30days-skill',
    installPath: '~/.claude/skills/last30days',
    status: 'installed',
    tags: ['Research', 'Reddit', 'X/Twitter', 'YouTube', 'Prompts'],
    emoji: '🔍',
    hasSearch: true,
    placeholder: 'Enter a topic to research... (e.g. "AI trading bots", "TikTok finance content")',
    examples: ['AI trading tools', 'TikTok finance creators', 'options flow scanners', 'Runway ML video generation', 'best stock chart libraries 2026'],
  },
];

export default function SkillsDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [showExamples, setShowExamples] = useState(false);
  const [expandedResult, setExpandedResult] = useState(true);

  const runSkill = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim() || running) return;
    setRunning(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch('/api/skills/last30days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: searchQuery.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data);
      setExpandedResult(true);
    } catch (err) {
      setError(err.message || 'Failed to run skill');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          🧠 Skills
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Installed agent skills and tools
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4">
        {SKILLS.map((skill) => (
          <div
            key={skill.name}
            className="group rounded-lg border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-700 hover:shadow-[0_0_24px_-4px_rgba(16,185,129,0.15)]"
          >
            {/* Icon + Name */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{skill.emoji}</span>
                <div>
                  <p className="text-base font-semibold text-zinc-100">
                    {skill.name}{' '}
                    <span className="text-xs font-normal text-zinc-500">
                      {skill.version}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500">by {skill.author}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                ✅ Installed
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              {skill.description}
            </p>

            {/* Search Input */}
            {skill.hasSearch && (
              <div className="mb-4">
                <form onSubmit={runSkill} className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={skill.placeholder}
                      className="w-full rounded-lg border border-zinc-700 bg-black/50 pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition"
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                      disabled={running}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={running || !searchQuery.trim()}
                    className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {running ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {running ? 'Researching...' : 'Run'}
                  </button>
                </form>

                {/* Example Topics */}
                <div className="mt-2">
                  <button
                    onClick={() => setShowExamples(!showExamples)}
                    className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-400 transition"
                  >
                    {showExamples ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    Example topics
                  </button>
                  {showExamples && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {skill.examples.map((ex) => (
                        <button
                          key={ex}
                          onClick={() => setSearchQuery(ex)}
                          className="rounded-md border border-zinc-800 bg-zinc-800/40 px-2.5 py-1 text-[11px] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 transition cursor-pointer"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                ❌ {error}
              </div>
            )}

            {/* Results */}
            {results && (
              <div className="mb-4">
                <button
                  onClick={() => setExpandedResult(!expandedResult)}
                  className="flex items-center gap-2 text-sm font-medium text-emerald-400 mb-2 hover:text-emerald-300 transition"
                >
                  {expandedResult ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Research Results — &quot;{results.topic}&quot;
                </button>
                {expandedResult && (
                  <div className="rounded-lg border border-zinc-800 bg-black/50 p-4 max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    <pre className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {results.output || results.summary || JSON.stringify(results, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Running indicator */}
            {running && (
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
                <div>
                  <p className="text-sm text-yellow-300">Researching &quot;{searchQuery}&quot;...</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">This can take 2-8 minutes depending on the topic</p>
                </div>
              </div>
            )}

            {/* Install path */}
            <p className="text-xs text-zinc-600 font-mono mb-4 truncate">
              📁 {skill.installPath}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {skill.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-zinc-800 bg-zinc-800/60 px-2 py-0.5 text-[11px] text-zinc-400"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <a
                href={skill.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition"
              >
                <ExternalLink className="h-3 w-3" /> GitHub
              </a>
              <a
                href={`${skill.github}#readme`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition"
              >
                Docs
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
