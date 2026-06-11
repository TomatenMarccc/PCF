alter function public.seed_mock_bom_for_part(uuid, text, text, numeric)
rename to seed_mock_bom_for_part_legacy;

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
begin
  perform public.seed_mock_bom_for_part_legacy(
    target_part_id,
    target_part_number,
    target_name,
    target_pcf
  );

  update public.bom_nodes
  set material_number = case level
    when 0 then target_part_number
    when 1 then format(
      '%s-M%s',
      target_part_number,
      lpad(split_part(node_key, '-', 2), 2, '0')
    )
    when 2 then format(
      '%s-C%s%s',
      target_part_number,
      lpad(split_part(node_key, '-', 2), 2, '0'),
      lpad(split_part(node_key, '-', 3), 2, '0')
    )
    when 3 then format(
      'MAT-%s%s%s-%s',
      lpad(split_part(node_key, '-', 2), 2, '0'),
      lpad(split_part(node_key, '-', 3), 2, '0'),
      lpad(split_part(node_key, '-', 4), 2, '0'),
      right(target_part_number, 4)
    )
    else material_number
  end
  where part_id = target_part_id;
end;
$$;

revoke execute on function public.seed_mock_bom_for_part(
  uuid, text, text, numeric
) from public, anon, authenticated;
revoke execute on function public.seed_mock_bom_for_part_legacy(
  uuid, text, text, numeric
) from public, anon, authenticated;

select public.seed_mock_bom_for_part(id, part_number, name, pcf_total)
from public.parts;
