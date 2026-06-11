import assert from "node:assert/strict";
import test from "node:test";

import {
  parsePartFilters,
  parseResultLimit,
  sanitizeSearchPattern,
} from "./part-filters.js";

test("parsePartFilters trims and converts filter values", () => {
  assert.deepEqual(
    parsePartFilters({
      partNumber: "  PCF-1001 ",
      plantCode: "",
      referenceYear: "2025",
      calculationMethod: "Catena-X",
    }),
    {
      partNumber: "PCF-1001",
      plantCode: undefined,
      referenceYear: 2025,
      calculationMethod: "Catena-X",
      productClass: undefined,
    },
  );
});

test("parseResultLimit only accepts supported values", () => {
  assert.equal(parseResultLimit("25"), 25);
  assert.equal(parseResultLimit("100"), 10);
});

test("sanitizeSearchPattern escapes PostgREST wildcard characters", () => {
  assert.equal(sanitizeSearchPattern("PCF_%"), "PCF\\_\\%");
});
