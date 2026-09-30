-- OneWear database schema.
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

create table if not exists public.listings (
  id            text primary key,
  title         text not null check (char_length(title) between 4 and 80),
  category      text not null,
  gender        text not null check (gender in ('women', 'men', 'unisex')),
  sizes         text[] not null,
  occasions     text[] not null,
  styles        text[] not null default '{}',
  colors        text[] not null,
  price         integer not null check (price between 50 and 20000),
  deposit       integer not null check (deposit between 0 and 50000),
  retail_price  integer not null check (retail_price >= 0),
  area_id       text not null,
  lender_name   text not null,
  lender_phone  text,                   -- private: used for SMS, shared only after accepting
  photo_url     text,                   -- public link to the photo in Storage
  owner_hash    text not null,          -- SHA-256 of the lender's device key, never the key itself
  created_at    timestamptz not null default now()
);

create table if not exists public.requests (
  id                 uuid primary key default gen_random_uuid(),
  listing_id         text not null,     -- a community listing id or a sample (seed) listing id
  listing_snapshot   jsonb not null,    -- what the outfit looked like when requested
  listing_owner_hash text,              -- null for sample listings (no real lender)
  event_date         date not null,
  borrower_name      text not null,
  borrower_contact   text not null,     -- shown to the lender only after they accept
  borrower_hash      text not null,
  lender_contact     text,              -- lender's number, filled in when they accept
  status             text not null default 'pending'
                     check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists requests_listing_idx  on public.requests (listing_id, status);
create index if not exists requests_borrower_idx on public.requests (borrower_hash);
create index if not exists requests_owner_idx    on public.requests (listing_owner_hash);
create index if not exists listings_owner_idx    on public.listings (owner_hash);

-- Row Level Security ON with no policies = the public (anon) key can read or
-- write nothing. Only the server, using the secret service-role key, can.
alter table public.listings enable row level security;

-- Public bucket for outfit photos (view by link; only the server can upload).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('outfit-photos', 'outfit-photos', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

alter table public.requests enable row level security;
