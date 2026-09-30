-- OneWear update: outfit photos + SMS notifications.
-- Run this ONCE in Supabase: SQL Editor -> New query -> paste -> Run.
-- Safe to run again; it skips anything that already exists.

-- Photo link for each outfit (the image itself lives in Storage).
alter table public.listings add column if not exists photo_url text;

-- Lender's phone number, used only by the server to send SMS.
-- Never sent to the browser until the lender accepts a request.
alter table public.listings add column if not exists lender_phone text;

-- The lender's number, copied onto a request when they accept it,
-- so the borrower can call them to arrange pickup.
alter table public.requests add column if not exists lender_contact text;

-- Public storage bucket for outfit photos: anyone can VIEW a photo by its
-- link, but only the server (secret key) can upload or delete.
-- Max 1 MB per photo, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('outfit-photos', 'outfit-photos', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

select 'Photos and SMS columns ready' as result;
