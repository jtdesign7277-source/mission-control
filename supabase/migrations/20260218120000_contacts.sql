-- Contacts table for Mission Control command center

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  phone text,
  category text not null default 'Other',
  notes text,
  created_at timestamptz not null default now(),
  last_emailed timestamptz
);

create index if not exists contacts_created_at_idx
  on public.contacts (created_at desc);

create index if not exists contacts_category_idx
  on public.contacts (category);

create index if not exists contacts_email_idx
  on public.contacts (email);

create index if not exists contacts_name_idx
  on public.contacts (name);

