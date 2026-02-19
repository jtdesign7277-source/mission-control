import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Aggregate analytics from all platforms
// Called by cron to snapshot, and by frontend for live data

const CACHE_TTL = 60_000; // 60s — matches frontend refresh interval
let cache = { data: null, ts: 0 };

async function fetchVercelStats() {
  try {
    // Use Vercel CLI token or env var
    const token = process.env.VERCEL_API_TOKEN;
    if (!token) return { visitors: null, deployments: null, error: 'No Vercel token' };

    const teamId = process.env.VERCEL_TEAM_ID || 'team_j6gGCEpsXE8etyGYJjSgEwHa';

    // Get recent deployments count
    const dRes = await fetch(`https://api.vercel.com/v6/deployments?teamId=${teamId}&limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const dData = dRes.ok ? await dRes.json() : {};

    return {
      deployments: dData.deployments?.length || 0,
      latestDeploy: dData.deployments?.[0]?.created || null,
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function fetchStripeStats() {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return { subscribers: null, mrr: null, error: 'No Stripe key' };

    // Active subscriptions
    const subRes = await fetch('https://api.stripe.com/v1/subscriptions?status=active&limit=100', {
      headers: { Authorization: `Basic ${Buffer.from(key + ':').toString('base64')}` },
    });
    const subData = subRes.ok ? await subRes.json() : {};
    const subs = subData.data || [];

    const mrr = subs.reduce((sum, s) => {
      const item = s.items?.data?.[0];
      if (item?.price?.unit_amount) return sum + item.price.unit_amount / 100;
      return sum;
    }, 0);

    // Total customers — use /v1/customers search with count
    const custRes = await fetch('https://api.stripe.com/v1/customers?limit=100', {
      headers: { Authorization: `Basic ${Buffer.from(key + ':').toString('base64')}` },
    });
    const custData = custRes.ok ? await custRes.json() : {};

    return {
      subscribers: subs.length,
      mrr: Math.round(mrr * 100) / 100,
      totalCustomers: custData.data?.length ?? 0,
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function fetchTwitterStats() {
  try {
    // Use X API - we have bearer token in env or hardcoded
    const bearer = process.env.X_BEARER_TOKEN;
    if (!bearer) return { followers: null, error: 'No X bearer token' };

    const userId = '2016113405451526144'; // @StratifyAI
    const res = await fetch(
      `https://api.twitter.com/2/users/${userId}?user.fields=public_metrics`,
      { headers: { Authorization: `Bearer ${bearer}` } }
    );
    const data = res.ok ? await res.json() : {};
    const metrics = data.data?.public_metrics || {};

    return {
      followers: metrics.followers_count || null,
      following: metrics.following_count || null,
      tweets: metrics.tweet_count || null,
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function fetchDiscordStats() {
  try {
    // Use Discord bot token or widget API
    const inviteCode = '6RPsREggYV';
    const res = await fetch(`https://discord.com/api/v10/invites/${inviteCode}?with_counts=true`);
    const data = res.ok ? await res.json() : {};

    return {
      members: data.approximate_member_count || null,
      online: data.approximate_presence_count || null,
      guildName: data.guild?.name || null,
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function fetchGitHubStats() {
  try {
    const res = await fetch('https://api.github.com/repos/jtdesign7277-source/stratify', {
      headers: { Accept: 'application/vnd.github+json' },
    });
    const data = res.ok ? await res.json() : {};

    return {
      stars: data.stargazers_count ?? null,
      forks: data.forks_count ?? null,
      watchers: data.subscribers_count ?? null,
      openIssues: data.open_issues_count ?? null,
    };
  } catch (e) {
    return { error: e.message };
  }
}

export async function GET() {
  const now = Date.now();
  if (cache.data && now - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  const [vercel, stripe, twitter, discord, github] = await Promise.all([
    fetchVercelStats(),
    fetchStripeStats(),
    fetchTwitterStats(),
    fetchDiscordStats(),
    fetchGitHubStats(),
  ]);

  const result = {
    timestamp: new Date().toISOString(),
    vercel,
    stripe,
    twitter,
    discord,
    github,
  };

  cache = { data: result, ts: now };
  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'CDN-Cache-Control': 'no-store',
    },
  });
}
