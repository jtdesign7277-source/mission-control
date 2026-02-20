import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY || 'key_082088191256c11ac4777d09d27780e63123b5f3ad8effc2b58df4b31cf307eae50d3bb52c9b6d0f8ab01bbf6201766a3e2af289bb5b218c4a0811bc9868649d';
const RUNWAY_BASE = 'https://api.dev.runwayml.com/v1';

export async function POST(request) {
  try {
    const { id } = await request.json();
    const supabase = getSupabaseAdminClient();

    const { data: video, error } = await supabase
      .from('tiktok_videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !video) throw new Error('Video not found');
    if (video.status !== 'generating' || !video.runway_task_id) {
      return NextResponse.json({ video });
    }

    // Poll Runway
    const res = await fetch(`${RUNWAY_BASE}/tasks/${video.runway_task_id}`, {
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'X-Runway-Version': '2024-11-06',
      },
    });

    if (!res.ok) throw new Error(`Runway poll error: ${res.status}`);

    const task = await res.json();

    if (task.status === 'SUCCEEDED') {
      const videoUrl = task.output?.[0] || task.artifacts?.[0]?.url || null;
      const { data: updated } = await supabase
        .from('tiktok_videos')
        .update({ status: 'ready', video_url: videoUrl, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      return NextResponse.json({ video: updated });
    } else if (task.status === 'FAILED') {
      const { data: updated } = await supabase
        .from('tiktok_videos')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      return NextResponse.json({ video: updated });
    }

    return NextResponse.json({ video });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
