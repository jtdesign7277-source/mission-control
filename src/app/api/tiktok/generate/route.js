import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY || 'key_082088191256c11ac4777d09d27780e63123b5f3ad8effc2b58df4b31cf307eae50d3bb52c9b6d0f8ab01bbf6201766a3e2af289bb5b218c4a0811bc9868649d';
const RUNWAY_BASE = 'https://api.dev.runwayml.com/v1';

export async function POST(request) {
  try {
    const { prompt, style } = await request.json();
    if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });

    const fullPrompt = style ? `${style} style: ${prompt}` : prompt;

    // Create Runway generation task
    const runwayRes = await fetch(`${RUNWAY_BASE}/text_to_video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        model: 'gen4.5',
        promptText: fullPrompt,
        duration: 5,
        ratio: '720:1280',
      }),
    });

    if (!runwayRes.ok) {
      const errBody = await runwayRes.text();
      throw new Error(`Runway API error ${runwayRes.status}: ${errBody}`);
    }

    const runwayData = await runwayRes.json();
    const taskId = runwayData.id;

    // Store in Supabase
    const supabase = getSupabaseAdminClient();
    const caption = prompt.length > 200 ? prompt.slice(0, 197) + '...' : prompt;

    const { data, error } = await supabase
      .from('tiktok_videos')
      .insert({
        prompt,
        caption,
        style: style || null,
        status: 'generating',
        runway_task_id: taskId,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ video: data }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
