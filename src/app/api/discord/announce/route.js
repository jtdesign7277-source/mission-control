import { NextResponse } from 'next/server';

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const API = 'https://discord.com/api/v10';

const headers = {
  Authorization: `Bot ${BOT_TOKEN}`,
  'Content-Type': 'application/json',
};

// POST — send an announcement or market alert to a channel
// Body: { channel?: string, content: string, type?: 'announcement' | 'alert' | 'deploy' }
export async function POST(req) {
  try {
    const body = await req.json();
    const { content, type = 'announcement' } = body;
    const channelName = body.channel || (type === 'deploy' ? 'announcements' : type === 'alert' ? 'market-talk' : 'announcements');

    if (!content) {
      return NextResponse.json({ error: 'content required' }, { status: 400 });
    }

    // Get channels
    const chRes = await fetch(`${API}/guilds/${GUILD_ID}/channels`, { headers });
    if (!chRes.ok) return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
    const channels = await chRes.json();
    const channel = channels.find((c) => c.name === channelName && c.type === 0);

    if (!channel) {
      return NextResponse.json({ error: `Channel #${channelName} not found` }, { status: 404 });
    }

    // Format based on type
    let formattedContent = content;
    if (type === 'deploy') {
      formattedContent = `🚀 **New Deployment**\n${content}`;
    } else if (type === 'alert') {
      formattedContent = `📊 **Market Alert**\n${content}`;
    }

    const msgRes = await fetch(`${API}/channels/${channel.id}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content: formattedContent }),
    });

    if (!msgRes.ok) {
      const err = await msgRes.text();
      return NextResponse.json({ error: err }, { status: msgRes.status });
    }

    return NextResponse.json({ ok: true, channel: channelName });
  } catch (err) {
    console.error('Discord announce error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
