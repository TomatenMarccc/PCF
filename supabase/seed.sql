insert into public.parts (
  id,
  part_number,
  name,
  status,
  bom_coverage,
  pcf_total,
  plant_code,
  product_class,
  calculation_method,
  reference_year,
  validity_year,
  primary_data_share,
  cx_data_quality_rating_total,
  pcf_calculation_version
)
values
  ('10000000-0000-4000-8000-000000000001', 'PCF-AX-1001', 'Aluminium Cross Member', 'Calculated', 94.50, 128.42, '1001', 'Chassis', 'Catena-X', 2025, 2027, 76.20, 91.40, '2.1'),
  ('10000000-0000-4000-8000-000000000002', 'PCF-BR-1042', 'Brake Carrier Assembly', 'Complete', 100.00, 42.18, '1001', 'Brake System', 'Catena-X', 2025, 2027, 88.50, 95.10, '2.1'),
  ('10000000-0000-4000-8000-000000000003', 'PCF-CS-2088', 'Center Console Structure', 'Calculated', 89.20, 18.76, '2040', 'Interior', 'Catena-X', 2024, 2026, 61.30, 84.70, '2.0'),
  ('10000000-0000-4000-8000-000000000004', 'PCF-DR-3021', 'Door Reinforcement Beam', 'In Progress', 72.40, 31.09, '2040', 'Body', 'Catena-X', 2025, 2027, 55.80, 78.90, '2.1'),
  ('10000000-0000-4000-8000-000000000005', 'PCF-EM-4105', 'Electric Motor Housing', 'Calculated', 96.10, 76.55, '3100', 'Powertrain', 'Catena-X', 2025, 2028, 82.40, 93.20, '2.2'),
  ('10000000-0000-4000-8000-000000000006', 'PCF-FM-5077', 'Front Module Support', 'Complete', 100.00, 54.22, '3100', 'Body', 'Catena-X', 2024, 2026, 90.10, 96.30, '2.0'),
  ('10000000-0000-4000-8000-000000000007', 'PCF-HV-6012', 'High-Voltage Battery Tray', 'Calculated', 91.70, 214.63, '4220', 'Battery', 'Catena-X', 2025, 2028, 70.60, 87.50, '2.2'),
  ('10000000-0000-4000-8000-000000000008', 'PCF-IP-7044', 'Instrument Panel Carrier', 'In Progress', 68.90, 23.41, '4220', 'Interior', 'Catena-X', 2025, 2027, 49.20, 74.60, '2.1'),
  ('10000000-0000-4000-8000-000000000009', 'PCF-LA-8090', 'Longitudinal Arm', 'Calculated', 93.80, 37.84, '5105', 'Chassis', 'Catena-X', 2024, 2026, 79.30, 89.80, '2.0'),
  ('10000000-0000-4000-8000-000000000010', 'PCF-RF-9023', 'Roof Frame Assembly', 'Complete', 100.00, 66.17, '5105', 'Body', 'Catena-X', 2025, 2027, 92.70, 97.10, '2.1'),
  ('10000000-0000-4000-8000-000000000011', 'PCF-SB-1150', 'Seat Base Structure', 'Calculated', 86.30, 29.95, '6200', 'Interior', 'Catena-X', 2024, 2026, 64.50, 82.30, '2.0'),
  ('10000000-0000-4000-8000-000000000012', 'PCF-TM-2214', 'Transmission Mount', 'In Progress', 75.60, 14.38, '6200', 'Powertrain', 'Catena-X', 2025, 2027, 57.90, 77.80, '2.1')
on conflict (part_number) do update set
  name = excluded.name,
  status = excluded.status,
  bom_coverage = excluded.bom_coverage,
  pcf_total = excluded.pcf_total,
  plant_code = excluded.plant_code,
  product_class = excluded.product_class,
  calculation_method = excluded.calculation_method,
  reference_year = excluded.reference_year,
  validity_year = excluded.validity_year,
  primary_data_share = excluded.primary_data_share,
  cx_data_quality_rating_total = excluded.cx_data_quality_rating_total,
  pcf_calculation_version = excluded.pcf_calculation_version;

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

select public.seed_mock_bom_for_part(id, part_number, name, pcf_total)
from public.parts;
