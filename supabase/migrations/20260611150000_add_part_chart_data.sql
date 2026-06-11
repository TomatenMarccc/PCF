create table if not exists public.part_chart_data (
  part_id uuid primary key references public.parts(id) on delete cascade,
  top_parts jsonb not null
    check (jsonb_typeof(top_parts) = 'array'),
  pcf_breakdown jsonb not null
    check (jsonb_typeof(pcf_breakdown) = 'array'),
  material_breakdown jsonb not null
    check (jsonb_typeof(material_breakdown) = 'array'),
  g2g_breakdown jsonb not null
    check (jsonb_typeof(g2g_breakdown) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists part_chart_data_set_updated_at on public.part_chart_data;
create trigger part_chart_data_set_updated_at
before update on public.part_chart_data
for each row execute function public.set_updated_at();

alter table public.part_chart_data enable row level security;

drop policy if exists "Part chart data is publicly readable"
  on public.part_chart_data;
create policy "Part chart data is publicly readable"
on public.part_chart_data
for select
to anon, authenticated
using (true);

grant select on public.part_chart_data to anon, authenticated;

insert into public.part_chart_data (
  part_id,
  top_parts,
  pcf_breakdown,
  material_breakdown,
  g2g_breakdown
)
select
  id,
  jsonb_build_array(
    jsonb_build_object('label', name || ' core', 'value', round(pcf_total * 0.48, 2)),
    jsonb_build_object('label', 'Housing assembly', 'value', round(pcf_total * 0.17, 2)),
    jsonb_build_object('label', 'Control unit', 'value', round(pcf_total * 0.13, 2)),
    jsonb_build_object('label', 'Fasteners', 'value', round(pcf_total * 0.09, 2)),
    jsonb_build_object('label', 'Auxiliary parts', 'value', round(pcf_total * 0.07, 2)),
    jsonb_build_object('label', 'Others', 'value', round(pcf_total * 0.06, 2))
  ),
  jsonb_build_array(
    jsonb_build_object('label', 'BOM-based PCF', 'value', round(pcf_total * 0.955, 2)),
    jsonb_build_object('label', 'G2G PCF total', 'value', round(pcf_total * 0.008, 2)),
    jsonb_build_object('label', 'Inbound logistics PCF', 'value', round(pcf_total * 0.012, 2)),
    jsonb_build_object('label', 'Outbound logistics PCF', 'value', round(pcf_total * 0.010, 2)),
    jsonb_build_object('label', 'Outbound packaging PCF', 'value', round(pcf_total * 0.015, 2))
  ),
  case product_class
    when 'Interior' then jsonb_build_array(
      jsonb_build_object('label', 'Thermoplastics', 'value', 61),
      jsonb_build_object('label', 'Electronics', 'value', 18),
      jsonb_build_object('label', 'Steel', 'value', 11),
      jsonb_build_object('label', 'Elastomers', 'value', 7),
      jsonb_build_object('label', 'Other materials', 'value', 3)
    )
    when 'Battery' then jsonb_build_array(
      jsonb_build_object('label', 'Aluminium', 'value', 38),
      jsonb_build_object('label', 'Steel', 'value', 24),
      jsonb_build_object('label', 'Electronics', 'value', 21),
      jsonb_build_object('label', 'Thermoplastics', 'value', 10),
      jsonb_build_object('label', 'Other materials', 'value', 7)
    )
    when 'Powertrain' then jsonb_build_array(
      jsonb_build_object('label', 'Aluminium', 'value', 44),
      jsonb_build_object('label', 'Steel', 'value', 30),
      jsonb_build_object('label', 'Electronics', 'value', 14),
      jsonb_build_object('label', 'Thermoplastics', 'value', 7),
      jsonb_build_object('label', 'Other materials', 'value', 5)
    )
    else jsonb_build_array(
      jsonb_build_object('label', 'Steel', 'value', 52),
      jsonb_build_object('label', 'Aluminium', 'value', 28),
      jsonb_build_object('label', 'Thermoplastics', 'value', 9),
      jsonb_build_object('label', 'Elastomers', 'value', 6),
      jsonb_build_object('label', 'Other materials', 'value', 5)
    )
  end,
  jsonb_build_array(
    jsonb_build_object('label', 'Average direct emissions', 'value', round(pcf_total * 0.0022, 3)),
    jsonb_build_object('label', 'Average heat steam cold', 'value', round(pcf_total * 0.0007, 3)),
    jsonb_build_object('label', 'Average stationary combustion', 'value', round(pcf_total * 0.0014, 3)),
    jsonb_build_object('label', 'Average water wastewater', 'value', round(pcf_total * 0.0008, 3)),
    jsonb_build_object('label', 'Average waste', 'value', round(pcf_total * 0.0006, 3)),
    jsonb_build_object('label', 'Average consumables', 'value', round(pcf_total * 0.0009, 3)),
    jsonb_build_object('label', 'Average electricity default', 'value', round(pcf_total * 0.0014, 3))
  )
from public.parts
on conflict (part_id) do update set
  top_parts = excluded.top_parts,
  pcf_breakdown = excluded.pcf_breakdown,
  material_breakdown = excluded.material_breakdown,
  g2g_breakdown = excluded.g2g_breakdown;
