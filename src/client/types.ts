export type PartStatus = "Calculated" | "In Progress" | "Complete";

export interface Part {
  id: string;
  part_number: string;
  name: string;
  status: PartStatus;
  bom_coverage: number;
  pcf_total: number;
  plant_code: string;
  product_class: string;
  calculation_method: string;
  reference_year: number;
  validity_year: number;
  primary_data_share: number;
  cx_data_quality_rating_total: number;
  pcf_calculation_version: string;
  created_at: string;
  updated_at: string;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface PartChartData {
  top_parts: ChartPoint[];
  pcf_breakdown: ChartPoint[];
  material_breakdown: ChartPoint[];
  g2g_breakdown: ChartPoint[];
}

export interface PartDetail extends Part {
  charts: PartChartData;
}

export interface FilterOptions {
  plantCodes: string[];
  referenceYears: number[];
  calculationMethods: string[];
  productClasses: string[];
}

export interface PartFilters {
  partNumber: string;
  plantCode: string;
  referenceYear: string;
  calculationMethod: string;
  productClass: string;
}
