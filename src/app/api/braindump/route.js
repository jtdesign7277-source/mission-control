import { NextResponse } from 'next/server';

const GITHUB_CONTENTS_URL =
  'https://api.github.com/repos/jtdesign7277-source/second-brain/contents/brain-dump';
const GITHUB_HEADERS = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'mission-control-braindump',
};
const DATE_RANGE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:-(\d{2}))?$/;
const CACHE_CONTROL = 'public, max-age=300, s-maxage=300, stale-while-revalidate=300';

async function fetchGitHubJson(url) {
  const response = await fetch(url, {
    headers: GITHUB_HEADERS,
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed (${response.status})`);
  }

  return response.json();
}

async function fetchMarkdown(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': GITHUB_HEADERS['User-Agent'],
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Markdown fetch failed (${response.status})`);
  }

  return response.text();
}

function extractTitle(markdown, fallbackTitle) {
  const headingMatch = markdown.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();
  return fallbackTitle;
}

function parseDateRangeSortKey(dateRange) {
  const match = DATE_RANGE_PATTERN.exec(String(dateRange || ''));
  if (!match) return 0;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const startDay = Number(match[3]);
  const endDay = match[4] ? Number(match[4]) : startDay;
  const timestamp = Date.UTC(year, month, endDay);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

async function fetchUpdateFromFolder(folder) {
  const folderItems = await fetchGitHubJson(folder.url);
  if (!Array.isArray(folderItems)) return null;

  const markdownFile = folderItems.find(
    (item) => item.type === 'file' && item.name.toLowerCase().endsWith('.md'),
  );
  if (!markdownFile) return null;

  let content = '';
  if (markdownFile.download_url) {
    content = await fetchMarkdown(markdownFile.download_url);
  } else if (markdownFile.url) {
    const filePayload = await fetchGitHubJson(markdownFile.url);
    const base64Content =
      typeof filePayload?.content === 'string' ? filePayload.content.replace(/\n/g, '') : '';
    content = base64Content ? Buffer.from(base64Content, 'base64').toString('utf8') : '';
  }

  return {
    date_range: folder.name,
    title: extractTitle(content, markdownFile.name.replace(/\.md$/i, '')),
    content,
  };
}

export async function GET() {
  try {
    const rootItems = await fetchGitHubJson(GITHUB_CONTENTS_URL);
    const dateFolders = Array.isArray(rootItems)
      ? rootItems.filter((item) => item?.type === 'dir' && DATE_RANGE_PATTERN.test(item?.name || ''))
      : [];

    const updates = (await Promise.all(dateFolders.map(fetchUpdateFromFolder)))
      .filter(Boolean)
      .sort((a, b) => parseDateRangeSortKey(b.date_range) - parseDateRangeSortKey(a.date_range));

    return NextResponse.json(updates, {
      headers: {
        'Cache-Control': CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error('braindump API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load brain dump updates' },
      {
        status: 500,
        headers: {
          'Cache-Control': CACHE_CONTROL,
        },
      },
    );
  }
}
