-- Mission Control core tables

create extension if not exists pgcrypto;

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  action text not null,
  status text not null default 'ok',
  metadata jsonb not null default '{}'::jsonb,
  duration integer,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_created_at_idx
  on public.activity_events (created_at desc);

create index if not exists activity_events_status_idx
  on public.activity_events (status);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service text not null,
  key_value text not null,
  category text not null default 'Other',
  created_at timestamptz not null default now(),
  last_used timestamptz,
  notes text
);

create index if not exists api_keys_category_idx
  on public.api_keys (category);

create index if not exists api_keys_created_at_idx
  on public.api_keys (created_at desc);

do $$
begin
  alter publication supabase_realtime add table public.activity_events;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.api_keys;
exception
  when duplicate_object then null;
end $$;
