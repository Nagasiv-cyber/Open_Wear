-- OneWear demo data
-- ------------------------------------------------------------
-- Fills the database with realistic listings and requests for a demo.
-- Safe to run more than once: it removes its own earlier demo rows first
-- and never touches real listings or requests.
--
-- BEFORE RUNNING: replace the two values on the marked lines below.
--   1. Your device key: open the OneWear site, press F12, click Console,
--      type   localStorage.getItem('onewear:key')   and press Enter.
--      Copy the value shown, without the quote marks.
--   2. The name you want shown as the lender of "your" outfits.
--
-- Everything runs inside one block, so it is all-or-nothing: if any
-- part fails, nothing is changed.
-- ------------------------------------------------------------

do $$
declare
  my_key  text := 'PASTE-YOUR-DEVICE-KEY-HERE';   -- <-- 1. your device key
  my_name text := 'Nagasiv';                      -- <-- 2. your name
  me      text;
begin
  if my_key = 'PASTE-YOUR-DEVICE-KEY-HERE' or length(trim(my_key)) < 32 then
    raise exception 'Paste your device key into the my_key line before running this script.';
  end if;
  -- The app stores only a SHA-256 fingerprint of the key, never the key itself.
  me := encode(extensions.digest(lower(trim(my_key)), 'sha256'), 'hex');

  -- 1. Remove earlier demo rows (demo listings start with local-demo-,
  --    demo phone numbers start with 90000).
  delete from public.requests
  where listing_id like 'local-demo-%' or borrower_contact like '90000%';
  delete from public.listings where id like 'local-demo-%';

  -- 2. Outfits. owner 'me' = your browser; others belong to demo lenders.
  insert into public.listings
    (id, title, category, gender, sizes, occasions, styles, colors,
     price, deposit, retail_price, area_id, lender_name, owner_hash)
  select
    v.id, v.title, v.category, v.gender, v.sizes, v.occasions, v.styles, v.colors,
    v.price, v.deposit, v.retail, v.area,
    case when v.owner = 'me' then my_name else v.lender end,
    case when v.owner = 'me' then me
         else encode(extensions.digest(v.owner, 'sha256'), 'hex') end
  from (values
  -- your outfits (requests for these land in YOUR Lender inbox)
  ('local-demo-01', 'Royal blue Kanjivaram with gold zari', 'saree', 'women', array['S','M','L'], array['wedding','festival'], array['traditional','bold'], array['#1B3A8C','#D4A017'], 700, 2500, 22000, 'rec-thandalam', null, 'me'),
  ('local-demo-02', 'Cream silk veshti set', 'veshti-set', 'men', array['M','L','XL'], array['wedding','festival','college'], array['traditional','minimal'], array['#FBF6E9','#C9A227'], 250, 800, 3800, 'rec-thandalam', null, 'me'),
  ('local-demo-03', 'Black tuxedo with satin lapels', 'blazer-suit', 'men', array['M','L'], array['party','interview','photoshoot'], array['formal','bold'], array['#111116','#3A3A46'], 650, 2500, 16000, 'poonamallee', null, 'me'),
  ('local-demo-04', 'Sage green organza lehenga', 'lehenga', 'women', array['S','M'], array['wedding','photoshoot','party'], array['minimal','modern'], array['#A9C2A5','#F1E4C8'], 950, 3000, 24000, 'porur', null, 'me'),
  -- other lenders' outfits
  ('local-demo-05', 'Magenta Banarasi silk', 'saree', 'women', array['M','L','XL'], array['wedding','festival'], array['bold','traditional'], array['#B5176B','#D9A21B'], 650, 2000, 19000, 'anna-nagar', 'Meenakshi R.', 'demo-lender-05'),
  ('local-demo-06', 'Pastel yellow haldi lehenga', 'lehenga', 'women', array['XS','S','M'], array['wedding','photoshoot'], array['minimal','traditional'], array['#F6E27A','#F7C6D0'], 850, 2500, 18000, 't-nagar', 'Shalini K.', 'demo-lender-06'),
  ('local-demo-07', 'Ivory sherwani with maroon stole', 'sherwani', 'men', array['L','XL'], array['wedding'], array['traditional','bold'], array['#F2EAD8','#7A1530'], 1200, 4000, 30000, 'nungambakkam', 'Farhan A.', 'demo-lender-07'),
  ('local-demo-08', 'Navy two-piece placement suit', 'blazer-suit', 'men', array['S','M','L'], array['interview','college'], array['formal','minimal'], array['#1D2B4F','#6C7A99'], 350, 1500, 9000, 'rec-thandalam', 'Gokul S.', 'demo-lender-08'),
  ('local-demo-09', 'Grey women''s blazer and trousers', 'formal-set', 'women', array['S','M','L'], array['interview'], array['formal','minimal'], array['#6E7079','#D9DAE0'], 320, 1200, 6500, 'rec-thandalam', 'Nivetha P.', 'demo-lender-09'),
  ('local-demo-10', 'Teal anarkali with mirror work', 'anarkali', 'women', array['M','L','XL'], array['festival','wedding','college'], array['traditional','bold'], array['#0E6B6B','#E0B84A'], 500, 1500, 9500, 'chromepet', 'Ayesha M.', 'demo-lender-10'),
  ('local-demo-11', 'Lilac chiffon evening gown', 'gown', 'women', array['S','M'], array['party','photoshoot'], array['modern','minimal'], array['#C7B3E6','#F4EEFB'], 650, 2000, 12500, 'adyar', 'Rhea J.', 'demo-lender-11'),
  ('local-demo-12', 'Red sequin party dress', 'dress', 'women', array['XS','S','M'], array['party','college'], array['bold','modern'], array['#B3122E','#F2C14E'], 400, 1200, 6000, 'velachery', 'Sanjana V.', 'demo-lender-12'),
  ('local-demo-13', 'Maroon kurta with gold jacket', 'kurta-set', 'men', array['M','L','XL'], array['wedding','festival','party'], array['traditional','bold'], array['#6A1426','#C9A227'], 450, 1500, 7500, 'tambaram', 'Prakash N.', 'demo-lender-13'),
  ('local-demo-14', 'White linen kurta pyjama', 'kurta-set', 'men', array['S','M','L'], array['festival','college','photoshoot'], array['minimal'], array['#FAFAF7','#D6D3C8'], 200, 600, 2800, 'rec-thandalam', 'Dinesh K.', 'demo-lender-14'),
  ('local-demo-15', 'Peach half saree with temple border', 'half-saree', 'women', array['XS','S','M'], array['festival','college','photoshoot'], array['traditional'], array['#F4B08C','#8C1D40'], 550, 1500, 10500, 'poonamallee', 'Kaviya S.', 'demo-lender-15'),
  ('local-demo-16', 'Charcoal Nehru jacket set', 'indo-western', 'men', array['M','L'], array['wedding','party','photoshoot'], array['modern','formal'], array['#34363C','#B08D57'], 600, 2000, 11000, 'guindy', 'Rohit M.', 'demo-lender-16'),
  ('local-demo-17', 'Mustard cotton saree', 'saree', 'women', array['M','L','XL','XXL'], array['college','festival','interview'], array['minimal','traditional'], array['#D9A21B','#6B3E1E'], 220, 700, 3000, 'rec-thandalam', 'Bhavana R.', 'demo-lender-17'),
  ('local-demo-18', 'Emerald velvet sherwani', 'sherwani', 'men', array['M','L','XL'], array['wedding','party'], array['bold','traditional'], array['#0B5A40','#D4A017'], 1100, 3500, 26000, 'kodambakkam', 'Imran H.', 'demo-lender-18'),
  ('local-demo-19', 'Powder pink indo-western set', 'indo-western', 'women', array['S','M','L'], array['party','photoshoot','college'], array['modern','minimal'], array['#EFC3CC','#FFFFFF'], 480, 1500, 8200, 'sholinganallur', 'Divya S.', 'demo-lender-19'),
  ('local-demo-20', 'Gold tissue silk saree', 'saree', 'women', array['S','M','L'], array['wedding','festival'], array['traditional','bold'], array['#C99A2E','#8C1D40'], 800, 3000, 26000, 'mylapore', 'Padma V.', 'demo-lender-20'),
  ('local-demo-21', 'Olive bandhgala with trousers', 'sherwani', 'men', array['S','M','L'], array['wedding','festival','party'], array['minimal','traditional'], array['#4F5A34','#D8CBA4'], 850, 3000, 17500, 'porur', 'Varun T.', 'demo-lender-21'),
  ('local-demo-22', 'Beige blazer with white shirt', 'blazer-suit', 'men', array['M','L','XL'], array['interview','college'], array['formal','minimal'], array['#CDBB99','#FFFFFF'], 300, 1200, 6200, 'chromepet', 'Ajay R.', 'demo-lender-22'),
  ('local-demo-23', 'Coral floral midi dress', 'dress', 'women', array['S','M','L'], array['photoshoot','party','college'], array['bold','modern'], array['#F47C6A','#FFF3E0'], 280, 900, 3800, 'besant-nagar', 'Nisha F.', 'demo-lender-23'),
  ('local-demo-24', 'Wine and gold bridal-guest lehenga', 'lehenga', 'women', array['M','L','XL'], array['wedding','festival'], array['bold','traditional'], array['#5E1224','#D4A017'], 1150, 4000, 30000, 'rec-thandalam', 'Sowmya D.', 'demo-lender-24')
  ) as v(id, title, category, gender, sizes, occasions, styles, colors, price, deposit, retail, area, lender, owner);

  -- 3. Requests. Each stores a snapshot of the outfit as it was when requested.
  insert into public.requests
    (listing_id, listing_snapshot, listing_owner_hash, event_date,
     borrower_name, borrower_contact, borrower_hash, status)
  select
    l.id,
    jsonb_build_object(
      'title', l.title, 'category', l.category, 'price', l.price, 'deposit', l.deposit,
      'retailPrice', l.retail_price, 'areaId', l.area_id, 'colors', to_jsonb(l.colors),
      'lender', jsonb_build_object('name', l.lender_name, 'verified', false)),
    l.owner_hash,
    current_date + r.days,
    case when r.who = 'me' then my_name else r.name end,
    r.phone,
    case when r.who = 'me' then me else encode(extensions.digest(r.who, 'sha256'), 'hex') end,
    r.status
  from (values
    -- people asking to rent YOUR outfits (your Lender inbox): 3 waiting, 1 accepted
    ('local-demo-01', 5,  'Harini V.',  '9000011111', 'demo-borrower-1', 'pending'),
    ('local-demo-04', 9,  'Swetha M.',  '9000022222', 'demo-borrower-2', 'pending'),
    ('local-demo-03', 12, 'Karthik R.', '9000033333', 'demo-borrower-3', 'pending'),
    ('local-demo-02', 18, 'Vignesh P.', '9000044444', 'demo-borrower-4', 'accepted'),
    -- bookings on other outfits, so some show as "already booked" this week
    ('local-demo-08', 2,  'Arun K.',    '9000055555', 'demo-borrower-5', 'accepted'),
    ('local-demo-24', 4,  'Pooja L.',   '9000066666', 'demo-borrower-6', 'accepted'),
    ('local-demo-05', 3,  'Revathi S.', '9000077777', 'demo-borrower-7', 'accepted'),
    ('local-demo-11', 6,  'Tanya G.',   '9000088888', 'demo-borrower-8', 'accepted'),
    -- YOUR own rentals (My rentals page and impact banner)
    ('local-demo-20', 15, null,         '9000099999', 'me',              'accepted'),
    ('local-demo-16', 22, null,         '9000099999', 'me',              'pending')
  ) as r(listing_id, days, name, phone, who, status)
  join public.listings l on l.id = r.listing_id;

  -- A request by you on one of the built-in sample outfits (no real lender).
  insert into public.requests
    (listing_id, listing_snapshot, listing_owner_hash, event_date,
     borrower_name, borrower_contact, borrower_hash, status)
  values ('ow-009',
    jsonb_build_object('title', 'Powder blue floral lehenga', 'category', 'lehenga', 'price', 900,
      'deposit', 3000, 'retailPrice', 21000, 'areaId', 'adyar',
      'colors', jsonb_build_array('#AFCBE3', '#F5D6E0'),
      'lender', jsonb_build_object('name', 'Nandhini R.', 'verified', true)),
    null, current_date + 27, my_name, '9000099999', me, 'pending');
end $$;

-- Summary of what is now in the database (expect 24 | 4 | 3 | 3).
select
  (select count(*) from public.listings where id like 'local-demo-%') as demo_listings,
  (select count(*) from public.listings l where l.owner_hash =
     (select owner_hash from public.listings where id = 'local-demo-01')) as your_listings,
  (select count(*) from public.requests r where r.status = 'pending' and r.listing_owner_hash =
     (select owner_hash from public.listings where id = 'local-demo-01')) as requests_waiting_for_you,
  (select count(*) from public.requests r where r.borrower_hash =
     (select owner_hash from public.listings where id = 'local-demo-01')) as your_rentals;
