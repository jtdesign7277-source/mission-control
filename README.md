# Mission Control

Independent Next.js 14 command center for live automation activity, Vercel deployment monitoring, inbox operations, and encrypted API key vault management.

## Views

- `Split`
- `Feed`
- `Kanban`
- `Deployments`
- `Email`
- `Keys`

## Stack

- Next.js 14 (App Router)
- Supabase (storage + realtime)
- Vercel REST API (`/v6/deployments`)
- Gmail API (OAuth2)
- Resend (send/reply)
- AES-256 key encryption

## Environment Variables

Copy `.env.example` to `.env.local` and set values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VERCEL_API_TOKEN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `RESEND_API_KEY`
- `ENCRYPTION_SECRET`

## Supabase Migration

Run migration SQL in Supabase:

- `supabase/migrations/20260217190000_mission_control_core.sql`

It creates:

- `activity_events`
- `api_keys`

And adds both tables to `supabase_realtime` publication.

## API Endpoints

### Activity
- `POST /api/activity`

### Deployments
- `GET /api/deployments`

### Email
- `GET /api/email/inbox`
- `GET /api/email/[id]`
- `POST /api/email/[id]` (`archive`, `markRead`, `markUnread`)
- `POST /api/email/send`

### Key Vault
- `GET /api/keys`
- `POST /api/keys`
- `PUT /api/keys/[id]`
- `DELETE /api/keys/[id]`
- `GET /api/keys/[id]/reveal`

## Local Dev

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.
