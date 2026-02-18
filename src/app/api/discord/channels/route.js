import { NextResponse } from 'next/server';

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const API = 'https://discord.com/api/v10';

const headers = {
  Authorization: `Bot ${BOT_TOKEN}`,
  'Content-Type': 'application/json',
};

// GET — list all text channels
export async function GET() {
  try {
    const res = await fetch(`${API}/guilds/${GUILD_ID}/channels`, { headers });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }
    const channels = await res.json();
    const textChannels = channels
      .filter((c) => c.type === 0)
      .sort((a, b) => a.position - b.position)
      .map((c) => ({ id: c.id, name: c.name, topic: c.topic, position: c.position }));

    return NextResponse.json({ channels: textChannels });
  } catch (err) {
    console.error('Discord channels error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
