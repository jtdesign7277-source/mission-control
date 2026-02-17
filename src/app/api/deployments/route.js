import { NextResponse } from 'next/server';

function formatDeployment(item) {
  const createdAt = item.createdAt ? new Date(item.createdAt) : null;
  const readyAt = item.ready ? new Date(item.ready) : null;
  const durationMs = createdAt
    ? Math.max(0, (readyAt ? readyAt.getTime() : Date.now()) - createdAt.getTime())
    : null;

  return {
    id: item.uid,
    project: item.name || item.projectName || 'Unknown Project',
    status: item.readyState || 'UNKNOWN',
    commitMessage:
      item.meta?.githubCommitMessage ||
      item.meta?.gitlabCommitMessage ||
      item.meta?.bitbucketCommitMessage ||
      item.meta?.message ||
      '(No commit message)',
    branch:
      item.meta?.githubCommitRef ||
      item.meta?.gitlabCommitRef ||
      item.meta?.bitbucketCommitRef ||
      'unknown',
    durationMs,
    timestamp: createdAt ? createdAt.toISOString() : null,
    url: item.url ? `https://${item.url}` : null,
  };
}

export async function GET() {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Missing VERCEL_API_TOKEN' }, { status: 500 });
  }

  try {
    const response = await fetch('https://api.vercel.com/v6/deployments?limit=30', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.error?.message || 'Failed to fetch deployments from Vercel' },
        { status: response.status },
      );
    }

    const deployments = Array.isArray(payload.deployments)
      ? payload.deployments.map(formatDeployment)
      : [];

    return NextResponse.json({ deployments });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Vercel API request failed' }, { status: 500 });
  }
}
