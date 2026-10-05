-- Validasi IMEI: 15 digit + Luhn
create or replace function public.is_valid_imei(v text) returns boolean
language plpgsql immutable as $$
declare s int := 0; d int; i int; dbl boolean := false;
begin
  if v !~ '^[0-9]{15}$' then return false; end if;
  for i in reverse 15..1 loop
    d := substr(v, i, 1)::int;
    if dbl then d := d * 2; if d > 9 then d := d - 9; end if; end if;
    s := s + d; dbl := not dbl;
  end loop;
  return s % 10 = 0;
end $$;

create table public.settings (
  owner_id uuid primary key default auth.uid() references auth.users(id),
  margin_target numeric not null default 0.12,        -- 12%
  fast_sale_threshold numeric not null default 0.15,  -- 15%
  stale_offer_days int not null default 14,
  stock_age_days int not null default 30,
  estimate_ttl_days int not null default 7
);

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  name text not null,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

create table public.phone_models (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  brand text not null,
  name text not null,
  ram_gb int,
  storage_gb int,
  watchlist boolean not null default false,
  created_at timestamptz not null default now(),
  unique nulls not distinct (owner_id, brand, name, ram_gb, storage_gb)
);

drop sequence if exists public.unit_code_seq; create sequence public.unit_code_seq;

create table public.units (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  code text not null unique default
    'HP-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.unit_code_seq')::text, 4, '0'),
  model_id uuid not null references public.phone_models(id),
  grade text not null default 'normal' check (grade in ('mulus','normal','minus','rusak')),
  status text not null default 'bought'
    check (status in ('bought','repair','ready','listed','sold')),
  source_type text not null check (source_type in ('lelang_gadai','beli_lain','lainnya')),
  source_ref text,                       -- nomor lot/dokumen saja, BUKAN data nasabah
  acquired_price bigint check (acquired_price >= 0),
  extra_cost bigint not null default 0 check (extra_cost >= 0),
  target_price bigint, sold_price bigint,
  sold_channel text check (sold_channel in ('fb_marketplace','konter','lainnya')),
  sold_to_shop_id uuid references public.shops(id),
  imei_check text not null default 'belum' check (imei_check in ('belum','aman','bermasalah')),
  acquired_at date, sold_at date, note text,
  created_at timestamptz not null default now()
);

create table public.unit_identifiers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  unit_id uuid not null references public.units(id) on delete cascade,
  kind text not null check (kind in ('imei1','imei2','serial')),
  value text not null unique,
  check (kind not like 'imei%' or public.is_valid_imei(value)),
  unique (unit_id, kind)
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  model_id uuid not null references public.phone_models(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  shop_id uuid not null references public.shops(id),
  grade text not null default 'normal',
  price bigint not null check (price > 0),
  status text not null default 'open' check (status in ('open','accepted','rejected')),
  note text,
  offered_at timestamptz not null default now()
);

create table public.market_observations (   -- pengamatan manual, mis. FB Marketplace
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  model_id uuid not null references public.phone_models(id) on delete cascade,
  grade text not null default 'normal',
  channel text not null check (channel in ('fb_marketplace','olx','tokopedia','shopee','lainnya')),
  price bigint not null check (price > 0),
  listing_state text not null default 'active' check (listing_state in ('active','sold')),
  url text, note text,
  observed_at timestamptz not null default now()
);

create table public.market_estimates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  model_id uuid not null references public.phone_models(id) on delete cascade,
  grade text not null default 'normal',
  method text not null check (method in ('ai','manual')),
  price_min bigint, price_p25 bigint, price_median bigint, price_p75 bigint, price_max bigint,
  sample_count int,
  confidence text check (confidence in ('low','medium','high')),
  sources jsonb not null default '[]',
  fetched_at timestamptz not null default now()
);

create table public.estimate_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  model_id uuid references public.phone_models(id) on delete set null,
  status text not null,                 -- ok | error | cached | rate_limited
  error text, latency_ms int,
  created_at timestamptz not null default now()
);

create index on public.offers (model_id, shop_id, offered_at desc);
create index on public.market_estimates (model_id, grade, fetched_at desc);
create index on public.market_observations (model_id, grade, observed_at desc);
create index on public.units (status);

-- View (security_invoker agar RLS tetap berlaku)
create view public.latest_offers with (security_invoker = true) as
select distinct on (model_id, coalesce(unit_id, '00000000-0000-0000-0000-000000000000'::uuid), shop_id) *
from public.offers
order by model_id, coalesce(unit_id, '00000000-0000-0000-0000-000000000000'::uuid), shop_id, offered_at desc;

create view public.latest_estimates with (security_invoker = true) as
select distinct on (model_id, grade) *
from public.market_estimates
order by model_id, grade, fetched_at desc;

create view public.unit_identifiers_masked with (security_invoker = true) as
select id, unit_id, kind, repeat('*', greatest(length(value) - 4, 0)) || right(value, 4) as masked_value
from public.unit_identifiers;

-- RLS untuk semua tabel
do $$
declare t text;
begin
  foreach t in array array['settings','shops','phone_models','units','unit_identifiers',
                           'offers','market_observations','market_estimates','estimate_runs']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "owner only" on public.%I for all to authenticated
                    using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t);
  end loop;
end $$;

revoke all on all tables in schema public from anon;
