import { NextResponse } from 'next/server';

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const API = 'https://discord.com/api/v10';

const headers = {
  Authorization: `Bot ${BOT_TOKEN}`,
  'Content-Type': 'application/json',
};

// GET — fetch recent messages from a channel (or all text channels)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    if (channelId) {
      const msgs = await fetchMessages(channelId, limit);
      return NextResponse.json({ messages: msgs });
    }

    // Fetch from all text channels
    const channels = await fetchTextChannels();
    const allMessages = [];

    for (const ch of channels.slice(0, 10)) {
      const msgs = await fetchMessages(ch.id, Math.min(limit, 20));
      allMessages.push(
        ...msgs.map((m) => ({
          ...m,
          _channelName: ch.name,
          _channelId: ch.id,
        }))
      );
    }

    allMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return NextResponse.json({
      messages: allMessages.slice(0, limit),
      channels,
    });
  } catch (err) {
    console.error('Discord messages GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — send a message to a channel
export async function POST(req) {
  try {
    const body = await req.json();
    const { channelId, content } = body;

    if (!channelId || !content) {
      return NextResponse.json({ error: 'channelId and content required' }, { status: 400 });
    }

    const res = await fetch(`${API}/channels/${channelId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const msg = await res.json();
    return NextResponse.json({ message: msg });
  } catch (err) {
    console.error('Discord messages POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function fetchTextChannels() {
  const res = await fetch(`${API}/guilds/${GUILD_ID}/channels`, { headers });
  if (!res.ok) return [];
  const channels = await res.json();
  // type 0 = text channel
  return channels.filter((c) => c.type === 0).sort((a, b) => a.position - b.position);
}

async function fetchMessages(channelId, limit = 50) {
  const res = await fetch(`${API}/channels/${channelId}/messages?limit=${limit}`, { headers });
  if (!res.ok) return [];
  return res.json();
}
