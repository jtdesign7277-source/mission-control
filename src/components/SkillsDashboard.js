'use client';

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
  },
];

export default function SkillsDashboard() {
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
              <button
                type="button"
                disabled
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 opacity-50 cursor-not-allowed"
              >
                ▶ Run
              </button>
              <a
                href={skill.github}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition"
              >
                GitHub
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
