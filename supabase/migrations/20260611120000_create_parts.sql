create extension if not exists "pgcrypto";

create table if not exists public.parts (
  id uuid primary key default gen_random_uuid(),
  part_number text not null unique,
  name text not null,
  status text not null default 'Calculated'
    check (status in ('Calculated', 'In Progress', 'Complete')),
  bom_coverage numeric(5, 2) not null default 0
    check (bom_coverage between 0 and 100),
  pcf_total numeric(14, 2) not null default 0
    check (pcf_total >= 0),
  plant_code text not null
    check (plant_code ~ '^[0-9]{4}$'),
  product_class text not null default 'TBD',
  calculation_method text not null default 'Catena-X',
  reference_year integer not null,
  validity_year integer not null,
  primary_data_share numeric(5, 2) not null default 0
    check (primary_data_share between 0 and 100),
  cx_data_quality_rating_total numeric(5, 2) not null default 0
    check (cx_data_quality_rating_total between 0 and 100),
  pcf_calculation_version text not null default '1.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists parts_part_number_idx
  on public.parts (part_number);
create index if not exists parts_filter_idx
  on public.parts (
    plant_code,
    reference_year,
    calculation_method,
    product_class
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists parts_set_updated_at on public.parts;
create trigger parts_set_updated_at
before update on public.parts
for each row execute function public.set_updated_at();

alter table public.parts enable row level security;

drop policy if exists "Parts are publicly readable" on public.parts;
create policy "Parts are publicly readable"
on public.parts
for select
to anon, authenticated
using (true);

grant select on public.parts to anon, authenticated;
