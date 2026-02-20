import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SENTRY_TOKEN = process.env.SENTRY_AUTH_TOKEN || '';
const SENTRY_ORG = process.env.SENTRY_ORG || 'jeff-thompson-uy';
const SENTRY_PROJECT = process.env.SENTRY_PROJECT || 'stratify';
const SENTRY_API = 'https://sentry.io/api/0';

async function sentryFetch(path) {
  const res = await fetch(`${SENTRY_API}${path}`, {
    headers: {
      Authorization: `Bearer ${SENTRY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sentry API ${res.status}: ${text}`);
  }
  return res.json();
}

export async function GET(request) {
  if (!SENTRY_TOKEN) {
    return NextResponse.json({ error: 'SENTRY_AUTH_TOKEN not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'issues';

    if (endpoint === 'issues') {
      const query = searchParams.get('query') || 'is:unresolved';
      const data = await sentryFetch(
        `/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/issues/?query=${encodeURIComponent(query)}&sort=date&limit=50`
      );
      return NextResponse.json({ issues: data });
    }

    if (endpoint === 'stats') {
      // Get project stats (errors over time)
      const stat = searchParams.get('stat') || 'received';
      const data = await sentryFetch(
        `/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/stats/?stat=${stat}&resolution=1d`
      );
      return NextResponse.json({ stats: data });
    }

    if (endpoint === 'project') {
      const data = await sentryFetch(`/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/`);
      return NextResponse.json({ project: data });
    }

    return NextResponse.json({ error: 'Unknown endpoint' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Resolve/unresolve/ignore an issue
export async function PATCH(request) {
  if (!SENTRY_TOKEN) {
    return NextResponse.json({ error: 'SENTRY_AUTH_TOKEN not configured' }, { status: 500 });
  }

  try {
    const { issueId, status } = await request.json();
    if (!issueId) return NextResponse.json({ error: 'Missing issueId' }, { status: 400 });

    const res = await fetch(`${SENTRY_API}/issues/${issueId}/`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${SENTRY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: status || 'resolved' }),
    });

    if (!res.ok) throw new Error(`Sentry API ${res.status}`);
    const data = await res.json();
    return NextResponse.json({ issue: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
