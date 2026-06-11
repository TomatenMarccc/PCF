import type { ParsedQs } from "qs";

export interface PartFilters {
  partNumber: string | undefined;
  plantCode: string | undefined;
  referenceYear: number | undefined;
  calculationMethod: string | undefined;
  productClass: string | undefined;
}

const ALLOWED_LIMITS = new Set([10, 25, 50]);

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export function parsePartFilters(query: ParsedQs): PartFilters {
  const referenceYearValue = readString(query.referenceYear);
  const referenceYear = referenceYearValue
    ? Number(referenceYearValue)
    : undefined;

  return {
    partNumber: readString(query.partNumber),
    plantCode: readString(query.plantCode),
    referenceYear:
      referenceYear !== undefined && Number.isInteger(referenceYear)
        ? referenceYear
        : undefined,
    calculationMethod: readString(query.calculationMethod),
    productClass: readString(query.productClass),
  };
}

export function parseResultLimit(value: unknown): number {
  const parsed = typeof value === "string" ? Number(value) : 10;
  return ALLOWED_LIMITS.has(parsed) ? parsed : 10;
}

export function sanitizeSearchPattern(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}
