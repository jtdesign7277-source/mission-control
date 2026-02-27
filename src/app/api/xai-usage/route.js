import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const REQUEST_TIMEOUT_MS = 12000;
const BREAKDOWN_AGENTS = [
  { name: 'TikTok Research', keywords: ['tiktokresearch', 'research'] },
  { name: 'Script', keywords: ['script'] },
  { name: 'Thumbnail', keywords: ['thumbnail'] },
];
const ESTIMATED_BREAKDOWN_WEIGHTS = [0.45, 0.35, 0.2];

function normalizeKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/,/g, '').trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function collectNumericEntries(node, path = '', depth = 0, entries = []) {
  if (depth > 8 || node == null) return entries;

  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      collectNumericEntries(item, `${path}[${index}]`, depth + 1, entries);
    });
    return entries;
  }

  if (typeof node === 'object') {
    Object.entries(node).forEach(([key, value]) => {
      const nextPath = path ? `${path}.${key}` : key;
      if (typeof value === 'number' && Number.isFinite(value)) {
        entries.push({
          path: nextPath,
          key,
          normalizedKey: normalizeKey(key),
          value,
        });
        return;
      }

      const parsed = parseNumber(value);
      if (parsed != null) {
        entries.push({
          path: nextPath,
          key,
          normalizedKey: normalizeKey(key),
          value: parsed,
        });
        return;
      }

      collectNumericEntries(value, nextPath, depth + 1, entries);
    });
  }

  return entries;
}

function findByNormalizedKey(entries, keys) {
  const normalizedWanted = keys.map(normalizeKey);
  for (const wanted of normalizedWanted) {
    const match = entries.find((entry) => entry.normalizedKey === wanted);
    if (match) return match.value;
  }
  return null;
}

function findByPathPattern(entries, patterns) {
  for (const pattern of patterns) {
    const match = entries.find((entry) => pattern.test(entry.path));
    if (match) return match.value;
  }
  return null;
}

function firstFinite(...values) {
  for (const value of values) {
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function normalizeUsage(payload) {
  const entries = collectNumericEntries(payload)
    .sort((a, b) => a.path.length - b.path.length);

  let totalTokens = firstFinite(
    findByNormalizedKey(entries, ['total_tokens', 'totalTokens', 'token_limit', 'tokens_total', 'monthly_token_limit']),
    findByPathPattern(entries, [/total.*token/i, /token.*limit/i, /quota/i]),
    parseNumber(process.env.XAI_TOTAL_TOKENS),
  );

  let usedTokens = firstFinite(
    findByNormalizedKey(entries, ['used_tokens', 'usedTokens', 'tokens_used', 'consumed_tokens', 'usage_tokens', 'spent_tokens']),
    findByPathPattern(entries, [/used.*token/i, /token.*used/i, /consum.*token/i]),
    parseNumber(process.env.XAI_USED_TOKENS),
  );

  let remainingTokens = firstFinite(
    findByNormalizedKey(entries, ['remaining_tokens', 'remainingTokens', 'tokens_remaining', 'available_tokens', 'token_balance']),
    findByPathPattern(entries, [/remain.*token/i, /token.*remain/i, /available.*token/i, /balance.*token/i]),
    parseNumber(process.env.XAI_REMAINING_TOKENS),
  );

  if (totalTokens == null && usedTokens != null && remainingTokens != null) {
    totalTokens = usedTokens + remainingTokens;
  }

  if (usedTokens == null && totalTokens != null && remainingTokens != null) {
    usedTokens = Math.max(0, totalTokens - remainingTokens);
  }

  if (remainingTokens == null && totalTokens != null && usedTokens != null) {
    remainingTokens = Math.max(0, totalTokens - usedTokens);
  }

  if (totalTokens == null && remainingTokens != null) {
    totalTokens = remainingTokens;
    usedTokens = 0;
  }

  if (totalTokens == null && usedTokens != null) {
    totalTokens = usedTokens;
    remainingTokens = 0;
  }

  totalTokens = Math.max(0, Number(totalTokens || 0));
  usedTokens = Math.max(0, Number(usedTokens || 0));
  remainingTokens = Math.max(0, Number(remainingTokens || 0));

  if (remainingTokens > totalTokens) {
    totalTokens = remainingTokens;
  }

  const percentage = totalTokens > 0
    ? Number(clamp((remainingTokens / totalTokens) * 100, 0, 100).toFixed(2))
    : 0;

  return {
    total_tokens: Math.round(totalTokens),
    used_tokens: Math.round(usedTokens),
    remaining_tokens: Math.round(remainingTokens),
    percentage,
    alert: percentage < 25,
  };
}

function extractBreakdownEntries(payload, depth = 0, found = []) {
  if (depth > 8 || payload == null) return found;

  if (Array.isArray(payload)) {
    const hasTokens = payload.some((item) => {
      if (!item || typeof item !== 'object') return false;
      return Object.keys(item).some((key) => normalizeKey(key).includes('token'));
    });

    if (hasTokens) {
      found.push(payload);
    }

    payload.forEach((item) => extractBreakdownEntries(item, depth + 1, found));
    return found;
  }

  if (typeof payload === 'object') {
    Object.values(payload).forEach((value) => extractBreakdownEntries(value, depth + 1, found));
  }

  return found;
}

function buildCronBreakdown(payload, usedTokens) {
  const arrays = extractBreakdownEntries(payload);
  const rows = [];

  arrays.forEach((arr) => {
    arr.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const label = String(
        item.agent || item.name || item.job || item.cron || item.label || item.id || '',
      ).trim();
      const tokens = firstFinite(
        parseNumber(item.tokens),
        parseNumber(item.used_tokens),
        parseNumber(item.total_tokens),
        parseNumber(item.token_count),
        parseNumber(item.usage_tokens),
      );
      if (!label || tokens == null) return;
      rows.push({ label, normalizedLabel: normalizeKey(label), tokens: Math.max(0, Number(tokens)) });
    });
  });

  const matched = BREAKDOWN_AGENTS.map((agent) => {
    const hit = rows.find((row) => agent.keywords.some((keyword) => row.normalizedLabel.includes(keyword)));
    return {
      name: agent.name,
      tokens: Math.round(hit?.tokens || 0),
      estimated: false,
    };
  });

  const hasRealBreakdown = matched.some((entry) => entry.tokens > 0);
  if (hasRealBreakdown) {
    return matched.map((entry) => ({
      ...entry,
      percentage: usedTokens > 0
        ? Number(((entry.tokens / usedTokens) * 100).toFixed(1))
        : 0,
    }));
  }

  if (usedTokens > 0) {
    const estimated = BREAKDOWN_AGENTS.map((agent, index) => {
      if (index === BREAKDOWN_AGENTS.length - 1) {
        const allocated = BREAKDOWN_AGENTS.slice(0, -1)
          .reduce((sum, _, i) => sum + Math.floor(usedTokens * ESTIMATED_BREAKDOWN_WEIGHTS[i]), 0);
        return {
          name: agent.name,
          tokens: Math.max(0, Math.round(usedTokens - allocated)),
          estimated: true,
        };
      }

      return {
        name: agent.name,
        tokens: Math.max(0, Math.floor(usedTokens * ESTIMATED_BREAKDOWN_WEIGHTS[index])),
        estimated: true,
      };
    });

    return estimated.map((entry) => ({
      ...entry,
      percentage: usedTokens > 0 ? Number(((entry.tokens / usedTokens) * 100).toFixed(1)) : 0,
    }));
  }

  return BREAKDOWN_AGENTS.map((agent) => ({
    name: agent.name,
    tokens: 0,
    percentage: 0,
    estimated: false,
  }));
}

function buildEndpointCandidates(teamId) {
  const candidates = [];

  if (process.env.XAI_USAGE_URL) {
    candidates.push(process.env.XAI_USAGE_URL.trim());
  }

  candidates.push('https://api.x.ai/v1/usage');
  candidates.push('https://api.x.ai/v1/usage?window=30d');
  candidates.push('https://api.x.ai/v1/usage/tokens');

  if (teamId) {
    candidates.push(`https://management-api.x.ai/v1/billing/teams/${teamId}/usage`);
    candidates.push(`https://management-api.x.ai/v1/billing/teams/${teamId}/usage-history`);
    candidates.push(`https://management-api.x.ai/v1/billing/teams/${teamId}/prepaid-balance`);
    candidates.push(`https://management-api.x.ai/v1/billing/teams/${teamId}`);
  }

  return [...new Set(candidates.filter(Boolean))];
}

async function fetchJson(url, apiKey) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-API-Key': apiKey,
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text();

    if (!response.ok) {
      const detail = typeof body === 'string'
        ? body.slice(0, 160)
        : body?.error || body?.message || '';
      throw new Error(`HTTP ${response.status}${detail ? `: ${detail}` : ''}`);
    }

    return body;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchUsagePayload(apiKey, teamId) {
  const endpoints = buildEndpointCandidates(teamId);
  const failures = [];

  for (const endpoint of endpoints) {
    try {
      const payload = await fetchJson(endpoint, apiKey);
      if (payload && typeof payload === 'object') {
        return { payload, endpoint };
      }
    } catch (error) {
      failures.push(`${endpoint} -> ${error.message}`);
    }
  }

  throw new Error(`Unable to fetch xAI usage. Tried: ${failures.join(' | ')}`);
}

function fallbackResponse(errorMessage = 'Unavailable') {
  return {
    total_tokens: 0,
    used_tokens: 0,
    remaining_tokens: 0,
    percentage: 0,
    alert: true,
    cron_breakdown: BREAKDOWN_AGENTS.map((agent) => ({
      name: agent.name,
      tokens: 0,
      percentage: 0,
      estimated: false,
    })),
    error: errorMessage,
    updated_at: new Date().toISOString(),
  };
}

export async function GET() {
  const apiKey = String(process.env.XAI_API_KEY || '').trim();
  const teamId = String(process.env.XAI_TEAM_ID || '').trim();

  if (!apiKey) {
    return NextResponse.json(
      fallbackResponse('Missing XAI_API_KEY environment variable'),
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      },
    );
  }

  try {
    const { payload, endpoint } = await fetchUsagePayload(apiKey, teamId);
    const normalized = normalizeUsage(payload);
    const cronBreakdown = buildCronBreakdown(payload, normalized.used_tokens);

    return NextResponse.json(
      {
        ...normalized,
        cron_breakdown: cronBreakdown,
        source: endpoint,
        updated_at: new Date().toISOString(),
      },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      },
    );
  } catch (error) {
    return NextResponse.json(
      fallbackResponse(error.message || 'Unable to fetch xAI usage'),
      {
        status: 502,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      },
    );
  }
}
