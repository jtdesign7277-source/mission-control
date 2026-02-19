'use client';

import { useCallback, useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronDown, ChevronUp, ClipboardCopy, MessageSquareText, Radar } from 'lucide-react';

const REDDIT_POSTS = [
  {
    id: 'algotrading-post',
    subreddit: 'r/algotrading',
    title: 'Build-in-public: wiring a live strategy control room before turning anything on',
    body: `I have been quietly building a trading command center for the last few months, and I am finally sharing progress in public because this community tends to catch weak assumptions quickly. The project is called Stratify, and the working public build is at https://stratify-black.vercel.app.

The main thing I am trying to solve is not alpha generation first, it is execution discipline and visibility. I got tired of having strategy notes in one place, broker logs in another place, and deployment status hidden in a third dashboard. So this week I finished a unified feed where every event lands in one timeline: strategy trigger, model output, order intent, order result, and any API failure. That sounds obvious, but seeing the full chain with timestamps immediately exposed problems I was missing in backtests.

Current architecture is Next.js for UI, Supabase for event persistence and realtime updates, and a lightweight workflow layer for scheduled jobs. I am now adding risk guardrails before I let it touch live capital. Hard limits include max daily loss, max position size by symbol liquidity bucket, and a kill switch that forces all automations to idle until manual review.

If you were shipping an algo stack from paper to low-size live, what would you validate first: slippage assumptions, broker edge cases, or monitoring coverage? I want to avoid the classic mistake where the strategy logic is fine but the operations layer quietly leaks money.`,
  },
  {
    id: 'daytrading-post',
    subreddit: 'r/daytrading',
    title: 'I built my own trade workflow dashboard because my routine kept breaking',
    body: `I am posting this because I finally admitted my issue was not market reading, it was process drift. I would start the week with a clean routine and by Wednesday I was improvising entries, skipping notes, and overtrading low-quality setups. I started building a personal dashboard to force structure, and I just pushed the latest version to https://stratify-black.vercel.app.

The core flow is simple. Premarket checklist first, then watchlist thesis, then execution window, then post-trade review. Every step is timestamped so I can see whether I actually followed the plan or just told myself I did. I also added a lightweight mood and energy tag because some of my worst sessions correlated with poor sleep and rushing into the open. That data is ugly but useful.

What surprised me is how much behavior changed once friction went down. If journaling takes thirty seconds, I do it. If it takes five minutes in a clunky notes app, I skip it. So now I can replay a day quickly: which setup type triggered, whether the stop respected the plan, and how long I held versus intended hold time.

I am not selling anything, this is still rough and built for my own accountability. But if other day traders have strong opinions on what belongs in a daily routine dashboard, I would genuinely value your feedback. Especially around what metrics matter most for consistency, not just PnL brag screenshots.`,
  },
  {
    id: 'sideproject-post',
    subreddit: 'r/SideProject',
    title: 'From random weekend hacking to a product people can actually use',
    body: `I wanted to share a realistic side-project update because most posts skip the messy middle. I started this as a weekend dashboard for myself after getting overwhelmed juggling trading notes, deployment alerts, emails, and community messages across too many tools. That prototype eventually became Stratify, and the current public build is at https://stratify-black.vercel.app.

The first version looked cool but solved almost nothing. It was mostly widgets with no clear workflow. The turning point was forcing one job-to-be-done statement: help me run a repeatable operating loop each day. Once I focused on that, features became easier to kill. I deleted a lot. Anything that did not reduce context switching got cut.

Current progress: realtime activity feed, workflow board, contact and email panels, and now a Reddit content hub because build-in-public updates started driving better product feedback than private notes. I am trying to keep every module useful on its own but cohesive together. The hardest part has been resisting "just one more feature" mode and instead improving reliability and speed.

I still have a full-time workload, so momentum comes from small daily pushes, not huge sprints. If you are building in nights and weekends too, what helped you cross from "fun prototype" to "people return to this weekly"? I am especially interested in retention loops that are lightweight and not spammy.`,
  },
  {
    id: 'reactjs-post',
    subreddit: 'r/reactjs',
    title: 'Sharing architecture choices from a real Next.js + React dashboard',
    body: `I have been building a React-heavy mission control app and thought this subreddit might have useful feedback on architecture decisions before I scale complexity further. Public build is here: https://stratify-black.vercel.app.

Stack is Next.js App Router with mostly client-side interaction for fast dashboard updates. I keep expensive data fetch and secret-dependent logic behind API routes, then stream results into UI panels with polling or realtime subscriptions depending on the data type. Early on, I overused global state and caused unnecessary re-renders. I have been slowly moving toward local state per panel plus memoized selectors where shared state is actually needed.

A practical pattern that helped: isolate each panel as a composable component with clear fetch boundaries and minimal prop surface. It reduced cascading bugs when one data source fails. I also added optimistic UI for action buttons in workflow controls, but with strict rollback paths so the interface never lies about system status.

Main tradeoff I am still evaluating is where to draw the server/client line for dashboard pages that have many interactive controls. Full server rendering gives cleaner data loading but can feel heavy once users start rapidly interacting. Full client rendering is snappy but easier to turn into a tangled state machine.

If you have built complex React dashboards, I would appreciate opinions on your preferred boundary patterns, especially around data freshness, error recovery, and keeping components testable as the app grows.`,
  },
  {
    id: 'options-post',
    subreddit: 'r/options',
    title: 'Build-in-public update: adding options risk context to avoid dumb entries',
    body: `I am building a personal trading platform and just started integrating options-specific context because I kept making directional calls without respecting structure risk. Live project is at https://stratify-black.vercel.app, still very much in progress.

The focus this week was adding a pre-trade options checklist panel. Before any order, I now log thesis type, time horizon, expected move, and what would invalidate the setup. Then the dashboard surfaces quick risk context: implied volatility percentile snapshot, spread width sanity check, and whether my planned position size breaches a max-risk rule tied to account equity.

This does not magically improve strategy edge, but it has already reduced impulsive entries where I chase a move without enough time premium or get lured into illiquid chains. I also started tracking post-trade outcomes by structure instead of just ticker. Seeing grouped stats by verticals, calendars, and straight calls/puts has been more useful than raw win rate.

I am not asking for trade signals. I am trying to build a repeatable process that survives bad streaks. If you actively trade options, what single risk metric or checklist item saved you the most money over time? Could be position sizing rules, liquidity filters, assignment awareness, or anything operational that new options builders usually underestimate.

Happy to share the exact checklist template if that would be useful to others testing process-driven execution.`,
  },
  {
    id: 'stocks-post',
    subreddit: 'r/stocks',
    title: 'I built a thesis tracker so my stock picks have receipts',
    body: `I lurk here often and wanted to share a tool I built for myself after realizing most of my stock decisions were not being tracked with enough honesty. The project is live at https://stratify-black.vercel.app and I am building it in public to force accountability.

The problem was simple: I could always invent a new narrative after the fact. If a trade worked, I called it skill. If it failed, I blamed market conditions. So I added a thesis tracker where each idea gets a timestamped entry with the original reasoning, catalyst window, risk factors, and explicit disconfirming signals. I cannot edit history without leaving a trail, which has been humbling in the best way.

I also created a weekly review board that clusters outcomes by thesis type: earnings momentum, valuation mean reversion, thematic trend, and event-driven plays. That view has helped me spot where I was basically gambling versus where I had a repeatable framework. A few ideas looked smart in isolation but were bad process in aggregate.

This is not financial advice and I am not posting picks here. I am trying to improve decision quality over time and reduce hindsight bias. If you already run a disciplined stock process, what is one field or rule you consider non-negotiable in your research log? I suspect many retail mistakes are process failures before they are analysis failures.`,
  },
  {
    id: 'webdev-post',
    subreddit: 'r/webdev',
    title: 'Practical lessons from shipping a realtime dashboard solo',
    body: `I wanted to share a realistic webdev build log in case it helps other solo builders who are stitching together product, infra, and UX at the same time. I am building Mission Control for Stratify and the current deployment is https://stratify-black.vercel.app.

Tech stack is Next.js + React + Tailwind on Vercel, Supabase for data and realtime events, and a set of API routes for external integrations. The app has multiple high-frequency panels, so my biggest challenge has been balancing responsiveness with operational safety. Polling everything made the UI noisy and expensive. Realtime everywhere made debugging difficult. I now use a hybrid approach: realtime for event streams, interval refresh for slower resources, and manual refresh for low-priority views.

From a frontend perspective, component isolation saved me. Each panel owns its loading state, error state, and retry logic. That way one failing integration does not collapse the whole dashboard. I also found that explicit empty states and tiny status indicators matter more than flashy visuals in tools users keep open all day.

Still rough edges: accessibility pass is incomplete, test coverage is not where I want it, and mobile layouts need one more polish cycle. But shipping incrementally in public has improved the product faster than private perfection loops.

If you build dashboards or internal tools, what architectural decision gave you the biggest stability win over time?`,
  },
  {
    id: 'fintech-post',
    subreddit: 'r/fintech',
    title: 'Building a fintech control layer before adding more growth features',
    body: `I am sharing an update from a fintech-focused build because I keep seeing products prioritize growth loops before operational controls, and I made the same mistake initially. Project link is https://stratify-black.vercel.app.

What I am building is a control layer for trading-related workflows: event visibility, account-level guardrails, communication history, and action logs that are auditable enough for small teams. Right now it is not a brokerage, it is the operating surface that sits around strategy execution and user workflows. The goal is to make decisions traceable so teams can answer "what happened, when, and why" without digging through five systems.

Recent improvements include structured event taxonomy, key management with masked reveals, workflow pause/resume controls, and a community/content panel to keep product feedback loops tight. Next up is stronger permission boundaries and better incident alerts because those become critical as soon as multiple operators touch the same system.

I am especially interested in lessons from people who have scaled early fintech infrastructure. Which controls did you implement earlier than expected and never regret? Examples could be immutable audit trails, role-based action policies, reconciliation checks, or customer communication logging standards.

Build-in-public has forced me to document tradeoffs instead of hiding them. If useful, I can share a deeper write-up on where I drew boundaries between speed, compliance readiness, and developer ergonomics at this stage.`,
  },
];

const WEEKLY_SCHEDULE = [
  { day: 'Monday', window: '8:30 AM ET', subreddit: 'r/algotrading', angle: 'Infra and execution reliability update' },
  { day: 'Tuesday', window: '7:15 AM ET', subreddit: 'r/daytrading', angle: 'Routine and discipline workflow lessons' },
  { day: 'Wednesday', window: '12:00 PM ET', subreddit: 'r/SideProject', angle: 'Founder-style build log and retention notes' },
  { day: 'Thursday', window: '9:00 AM ET', subreddit: 'r/reactjs', angle: 'Frontend architecture decisions and tradeoffs' },
  { day: 'Friday', window: '10:30 AM ET', subreddit: 'r/options', angle: 'Risk controls and options checklist insights' },
  { day: 'Saturday', window: '11:00 AM ET', subreddit: 'r/stocks', angle: 'Thesis tracking and review process recap' },
  { day: 'Sunday', window: '1:00 PM ET', subreddit: 'r/webdev', angle: 'Shipping recap and engineering lessons learned' },
  { day: 'Sunday', window: '6:00 PM ET', subreddit: 'r/fintech', angle: 'Ops controls, compliance posture, next milestones' },
];

const SUBREDDIT_INTEL = [
  {
    subreddit: 'r/algotrading',
    vibe: 'Technical and skeptical; show process evidence, not hype.',
    bestPostType: 'Architecture breakdowns, risk controls, and real deployment lessons.',
    caution: 'Avoid ROI chest-thumping and vague alpha claims.',
  },
  {
    subreddit: 'r/daytrading',
    vibe: 'Execution-focused with strong opinions on discipline.',
    bestPostType: 'Playbook improvements, mistakes, and concrete journaling takeaways.',
    caution: 'Avoid hindsight flexing and one-liner motivational posts.',
  },
  {
    subreddit: 'r/SideProject',
    vibe: 'Builder-friendly; honest progress updates perform well.',
    bestPostType: 'Before/after product improvements and what changed retention.',
    caution: 'Avoid hard selling or posts with no story arc.',
  },
  {
    subreddit: 'r/reactjs',
    vibe: 'Pattern-driven; people value explicit tradeoffs.',
    bestPostType: 'Code architecture rationale, performance constraints, and testing plans.',
    caution: 'Avoid framework wars and superficial "look what I built" screenshots.',
  },
  {
    subreddit: 'r/options',
    vibe: 'Risk-aware community that responds to practical rules.',
    bestPostType: 'Checklist systems, trade structuring, and post-mortem analysis.',
    caution: 'Avoid lotto-style framing and undefined risk.',
  },
  {
    subreddit: 'r/stocks',
    vibe: 'Mixed audience; clarity and humility travel farther than certainty.',
    bestPostType: 'Thesis journaling methods and bias-reduction workflows.',
    caution: 'Avoid turning the thread into ticker pumping.',
  },
  {
    subreddit: 'r/webdev',
    vibe: 'Builders want practical implementation details.',
    bestPostType: 'Stack choices, deployment tradeoffs, and reliability tactics.',
    caution: 'Avoid generic productivity advice disconnected from code.',
  },
  {
    subreddit: 'r/fintech',
    vibe: 'Ops and compliance minded; concrete controls matter.',
    bestPostType: 'Auditability, permissions, and infrastructure maturity decisions.',
    caution: 'Avoid pretending regulation and risk can be deferred forever.',
  },
];

function wordCount(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function excerpt(text, count = 42) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= count) return text;
  return `${words.slice(0, count).join(' ')}...`;
}

export default function RedditDashboard() {
  const [expandedPostIds, setExpandedPostIds] = useState(() => new Set([REDDIT_POSTS[0].id]));
  const [copiedPostId, setCopiedPostId] = useState('');

  const postMetrics = useMemo(
    () =>
      REDDIT_POSTS.map((post) => ({
        id: post.id,
        wordCount: wordCount(post.body),
      })),
    [],
  );

  const postMetricsById = useMemo(
    () => Object.fromEntries(postMetrics.map((metric) => [metric.id, metric.wordCount])),
    [postMetrics],
  );

  const totalWords = useMemo(
    () => postMetrics.reduce((sum, metric) => sum + metric.wordCount, 0),
    [postMetrics],
  );

  const togglePost = useCallback((postId) => {
    setExpandedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  }, []);

  const copyPost = useCallback(async (post) => {
    const payload = `${post.title}\n\n${post.body}`;
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedPostId(post.id);
      setTimeout(() => setCopiedPostId(''), 1800);
    } catch {
      setCopiedPostId('');
    }
  }, []);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
              <MessageSquareText className="h-4 w-4 text-orange-300" />
              Reddit Content Hub
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-zinc-400">
              Ready-to-post build-in-public drafts tailored to target subreddits. Every draft includes a direct product link to{' '}
              <a
                href="https://stratify-black.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-300 hover:text-emerald-200"
              >
                stratify-black.vercel.app
              </a>
              .
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-right">
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Draft Stats</p>
            <p className="mt-1 text-sm font-medium text-zinc-200">{REDDIT_POSTS.length} posts</p>
            <p className="text-xs text-zinc-400">{totalWords.toLocaleString()} total words</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Radar className="h-4 w-4 text-orange-300" />
          Post Library
        </div>

        <div className="space-y-3">
          {REDDIT_POSTS.map((post) => {
            const expanded = expandedPostIds.has(post.id);
            const isCopied = copiedPostId === post.id;
            const words = postMetricsById[post.id] || 0;

            return (
              <article key={post.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50">
                <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => togglePost(post.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{post.subreddit}</p>
                    <h3 className="mt-1 text-sm font-semibold text-zinc-100">{post.title}</h3>
                    <p className="mt-2 text-xs text-zinc-500">{words} words</p>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyPost(post)}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 hover:border-zinc-600"
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
                      {isCopied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePost(post.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 hover:border-zinc-600"
                    >
                      {expanded ? 'Collapse' : 'Expand'}
                      {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="border-t border-zinc-800 px-4 py-3">
                  <p className={`whitespace-pre-wrap text-sm leading-relaxed ${expanded ? 'text-zinc-200' : 'text-zinc-400'}`}>
                    {expanded ? post.body : excerpt(post.body)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <CalendarDays className="h-4 w-4 text-emerald-300" />
            Weekly Posting Schedule
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-[0.14em] text-zinc-500">
                  <th className="px-2 py-2 font-medium">Day</th>
                  <th className="px-2 py-2 font-medium">Time</th>
                  <th className="px-2 py-2 font-medium">Subreddit</th>
                  <th className="px-2 py-2 font-medium">Focus</th>
                </tr>
              </thead>
              <tbody>
                {WEEKLY_SCHEDULE.map((slot) => (
                  <tr key={`${slot.day}-${slot.subreddit}-${slot.window}`} className="border-b border-zinc-900 text-zinc-300 last:border-0">
                    <td className="px-2 py-2">{slot.day}</td>
                    <td className="px-2 py-2 text-zinc-400">{slot.window}</td>
                    <td className="px-2 py-2 font-medium text-zinc-200">{slot.subreddit}</td>
                    <td className="px-2 py-2 text-zinc-400">{slot.angle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-200">Subreddit Intel</h3>
          <div className="space-y-2">
            {SUBREDDIT_INTEL.map((intel) => (
              <div key={intel.subreddit} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{intel.subreddit}</p>
                <p className="mt-2 text-xs text-zinc-300">{intel.vibe}</p>
                <p className="mt-2 text-xs text-zinc-400">Best angle: {intel.bestPostType}</p>
                <p className="mt-1 text-xs text-zinc-500">Avoid: {intel.caution}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
