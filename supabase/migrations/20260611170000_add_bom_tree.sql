create table if not exists public.bom_nodes (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references public.parts(id) on delete cascade,
  node_key text not null,
  parent_node_key text,
  material_number text not null,
  description text not null,
  source text not null default 'SAP',
  quantity numeric(12, 3) not null default 1
    check (quantity > 0),
  pcf numeric(14, 4) not null default 0
    check (pcf >= 0),
  pcf_upstream numeric(14, 4) not null default 0
    check (pcf_upstream >= 0),
  mcf numeric(14, 4) not null default 0
    check (mcf >= 0),
  level integer not null
    check (level between 0 and 12),
  is_leaf boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (part_id, node_key)
);

create index if not exists bom_nodes_part_parent_idx
  on public.bom_nodes (part_id, parent_node_key);
create index if not exists bom_nodes_part_material_idx
  on public.bom_nodes (part_id, material_number);

drop trigger if exists bom_nodes_set_updated_at on public.bom_nodes;
create trigger bom_nodes_set_updated_at
before update on public.bom_nodes
for each row execute function public.set_updated_at();

alter table public.bom_nodes enable row level security;

drop policy if exists "BOM nodes are publicly readable" on public.bom_nodes;
create policy "BOM nodes are publicly readable"
on public.bom_nodes
for select
to anon, authenticated
using (true);

grant select on public.bom_nodes to anon, authenticated;

create or replace function public.seed_mock_bom_for_part(
  target_part_id uuid,
  target_part_number text,
  target_name text,
  target_pcf numeric
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  module_names text[] := array[
    'Housing and structure',
    'Electronic controls',
    'Mechanical assembly',
    'Connection system',
    'Thermal management',
    'Auxiliary components'
  ];
  component_names text[] := array[
    'Primary assembly',
    'Secondary assembly',
    'Interface component',
    'Mounting component',
    'Supporting component'
  ];
  material_names text[] := array[
    'Steel material',
    'Aluminium material',
    'Thermoplastic material'
  ];
  module_weights numeric[] := array[0.26, 0.21, 0.18, 0.14, 0.12, 0.09];
  component_weights numeric[] := array[0.28, 0.24, 0.20, 0.16, 0.12];
  material_weights numeric[] := array[0.50, 0.30, 0.20];
  module_index integer;
  component_index integer;
  material_index integer;
  module_key text;
  component_key text;
  module_pcf numeric;
  component_pcf numeric;
  material_pcf numeric;
begin
  insert into public.bom_nodes (
    part_id, node_key, parent_node_key, material_number, description,
    source, quantity, pcf, pcf_upstream, mcf, level, is_leaf
  )
  values (
    target_part_id, 'root', null, target_part_number, target_name,
    'MACS', 1, target_pcf, target_pcf * 0.91, target_pcf * 0.09, 0, false
  )
  on conflict (part_id, node_key) do update set
    parent_node_key = excluded.parent_node_key,
    material_number = excluded.material_number,
    description = excluded.description,
    source = excluded.source,
    quantity = excluded.quantity,
    pcf = excluded.pcf,
    pcf_upstream = excluded.pcf_upstream,
    mcf = excluded.mcf,
    level = excluded.level,
    is_leaf = excluded.is_leaf;

  for module_index in 1..6 loop
    module_key := format('module-%s', module_index);
    module_pcf := target_pcf * module_weights[module_index];

    insert into public.bom_nodes (
      part_id, node_key, parent_node_key, material_number, description,
      source, quantity, pcf, pcf_upstream, mcf, level, is_leaf
    )
    values (
      target_part_id,
      module_key,
      'root',
      format('%s-M%02s', target_part_number, module_index),
      module_names[module_index],
      'MACS',
      1,
      module_pcf,
      module_pcf * 0.88,
      module_pcf * 0.12,
      1,
      false
    )
    on conflict (part_id, node_key) do update set
      parent_node_key = excluded.parent_node_key,
      material_number = excluded.material_number,
      description = excluded.description,
      source = excluded.source,
      quantity = excluded.quantity,
      pcf = excluded.pcf,
      pcf_upstream = excluded.pcf_upstream,
      mcf = excluded.mcf,
      level = excluded.level,
      is_leaf = excluded.is_leaf;

    for component_index in 1..5 loop
      component_key := format(
        'component-%s-%s',
        module_index,
        component_index
      );
      component_pcf :=
        module_pcf * component_weights[component_index];

      insert into public.bom_nodes (
        part_id, node_key, parent_node_key, material_number, description,
        source, quantity, pcf, pcf_upstream, mcf, level, is_leaf
      )
      values (
        target_part_id,
        component_key,
        module_key,
        format(
          '%s-C%02s%02s',
          target_part_number,
          module_index,
          component_index
        ),
        format(
          '%s %s',
          module_names[module_index],
          component_names[component_index]
        ),
        'SAP',
        component_index,
        component_pcf,
        component_pcf * 0.84,
        component_pcf * 0.16,
        2,
        false
      )
      on conflict (part_id, node_key) do update set
        parent_node_key = excluded.parent_node_key,
        material_number = excluded.material_number,
        description = excluded.description,
        source = excluded.source,
        quantity = excluded.quantity,
        pcf = excluded.pcf,
        pcf_upstream = excluded.pcf_upstream,
        mcf = excluded.mcf,
        level = excluded.level,
        is_leaf = excluded.is_leaf;

      for material_index in 1..3 loop
        material_pcf :=
          component_pcf * material_weights[material_index];

        insert into public.bom_nodes (
          part_id, node_key, parent_node_key, material_number, description,
          source, quantity, pcf, pcf_upstream, mcf, level, is_leaf
        )
        values (
          target_part_id,
          format(
            'material-%s-%s-%s',
            module_index,
            component_index,
            material_index
          ),
          component_key,
          format(
            'MAT-%02s%02s%02s-%s',
            module_index,
            component_index,
            material_index,
            right(target_part_number, 4)
          ),
          format(
            '%s for %s',
            material_names[material_index],
            component_names[component_index]
          ),
          'SAP',
          (component_index + material_index)::numeric / 2,
          material_pcf,
          material_pcf * 0.96,
          material_pcf * 0.04,
          3,
          true
        )
        on conflict (part_id, node_key) do update set
          parent_node_key = excluded.parent_node_key,
          material_number = excluded.material_number,
          description = excluded.description,
          source = excluded.source,
          quantity = excluded.quantity,
          pcf = excluded.pcf,
          pcf_upstream = excluded.pcf_upstream,
          mcf = excluded.mcf,
          level = excluded.level,
          is_leaf = excluded.is_leaf;
      end loop;
    end loop;
  end loop;
end;
$$;

revoke execute on function public.seed_mock_bom_for_part(
  uuid, text, text, numeric
) from public, anon, authenticated;

select public.seed_mock_bom_for_part(id, part_number, name, pcf_total)
from public.parts;
