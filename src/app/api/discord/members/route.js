import { NextResponse } from 'next/server';

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const API = 'https://discord.com/api/v10';

const headers = { Authorization: `Bot ${BOT_TOKEN}` };

export async function GET() {
  try {
    const res = await fetch(`${API}/guilds/${GUILD_ID}?with_counts=true`, { headers });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }
    const guild = await res.json();
    return NextResponse.json({
      name: guild.name,
      memberCount: guild.approximate_member_count,
      onlineCount: guild.approximate_presence_count,
      icon: guild.icon ? `https://cdn.discordapp.com/icons/${GUILD_ID}/${guild.icon}.png` : null,
    });
  } catch (err) {
    console.error('Discord members error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
