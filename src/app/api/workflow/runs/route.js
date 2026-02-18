import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const JOB_FOLDERS = {
  'e7dea1ba': { folder: 'cron:x-engagement', localPath: null },
  '596a2309': { folder: 'cron:market-intel', localPath: '/Users/stratify/third-brain/market-intel/' },
  '75f2b428': { folder: 'cron:trade-log', localPath: null },
  '3bfdbb62': { folder: 'cron:daily-summary', localPath: '/Users/stratify/Desktop/second-brain/notes/' },
  'c1098238': { folder: null, localPath: null },
  '22b48176': { folder: null, localPath: null },
  '950cd7b4': { folder: null, localPath: null },
  '8770aca7': { folder: 'cron:weekly-recap', localPath: null },
  '80bc83ac': { folder: null, localPath: null },
};

const SECOND_BRAIN_API = 'https://second-brain-beige-gamma.vercel.app/api/documents';

function readLocalFiles(dirPath, limit = 5) {
  try {
    if (!fs.existsSync(dirPath)) return [];
    const files = fs.readdirSync(dirPath)
      .filter(f => !f.startsWith('.'))
      .map(f => {
        const fullPath = path.join(dirPath, f);
        const stat = fs.statSync(fullPath);
        return { name: f, fullPath, mtime: stat.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, limit);

    return files.map(f => ({
      id: f.name,
      title: f.name.replace(/\.(md|txt|json)$/i, ''),
      content: fs.readFileSync(f.fullPath, 'utf-8').slice(0, 5000),
      createdAt: new Date(f.mtime).toISOString(),
    }));
  } catch (e) {
    console.error('readLocalFiles error:', e);
    return [];
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId || !JOB_FOLDERS[jobId]) {
    return NextResponse.json({ runs: [], error: 'Unknown job ID' });
  }

  const { folder, localPath } = JOB_FOLDERS[jobId];

  if (!folder && !localPath) {
    return NextResponse.json({ runs: [], message: 'This job has no persistent output' });
  }

  // Try Second Brain API first
  if (folder) {
    try {
      const res = await fetch(`${SECOND_BRAIN_API}?folder=${encodeURIComponent(folder)}&limit=5`, {
        next: { revalidate: 0 },
      });
      if (res.ok) {
        const data = await res.json();
        const docs = Array.isArray(data) ? data : data.documents || [];
        if (docs.length > 0) {
          const runs = docs.map(d => ({
            id: d.id || d._id || d.title,
            title: d.title || 'Untitled',
            content: (d.content || '').slice(0, 5000),
            createdAt: d.created_at || d.createdAt || d.timestamp || null,
          }));
          return NextResponse.json({ runs });
        }
      }
    } catch (e) {
      console.error('Second Brain API error:', e);
    }
  }

  // Fallback to local files
  if (localPath) {
    const runs = readLocalFiles(localPath, 5);
    return NextResponse.json({ runs });
  }

  return NextResponse.json({ runs: [] });
}
