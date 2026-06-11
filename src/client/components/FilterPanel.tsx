import { RotateCcw, Search } from "lucide-react";

import type { FilterOptions, PartFilters } from "../types";

interface FilterPanelProps {
  filters: PartFilters;
  options: FilterOptions;
  onChange: (filters: PartFilters) => void;
}

export function FilterPanel({
  filters,
  options,
  onChange,
}: FilterPanelProps) {
  function update(key: keyof PartFilters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  function reset() {
    onChange({
      partNumber: "",
      plantCode: "",
      referenceYear: "",
      calculationMethod: "",
      productClass: "",
    });
  }

  return (
    <aside className="filter-panel">
      <div className="panel-heading">
        <p className="eyebrow">Database search</p>
        <h2>Search PCF</h2>
        <p>Find and compare product carbon footprint records.</p>
      </div>

      <section className="filter-section">
        <div className="section-label">
          <span>01</span>
          <h3>Search Criteria</h3>
        </div>
        <label className="field">
          <span>
            Part Number <small>PRIMARY</small>
          </span>
          <div className="input-with-icon">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={filters.partNumber}
              placeholder="Enter part number"
              onChange={(event) => update("partNumber", event.target.value)}
            />
          </div>
        </label>
      </section>

      <section className="filter-section">
        <div className="section-label">
          <span>02</span>
          <h3>Filter Criteria</h3>
        </div>
        <SelectField
          label="Plant Code"
          value={filters.plantCode}
          values={options.plantCodes}
          onChange={(value) => update("plantCode", value)}
        />
        <SelectField
          label="Reference Year"
          value={filters.referenceYear}
          values={options.referenceYears.map(String)}
          onChange={(value) => update("referenceYear", value)}
        />
        <SelectField
          label="Calculation Method"
          value={filters.calculationMethod}
          values={options.calculationMethods}
          onChange={(value) => update("calculationMethod", value)}
        />
        <SelectField
          label="Product Class"
          value={filters.productClass}
          values={options.productClasses}
          onChange={(value) => update("productClass", value)}
        />
      </section>

      <button type="button" className="secondary-button full-width" onClick={reset}>
        <RotateCcw size={16} />
        Reset filters
      </button>
    </aside>
  );
}

function SelectField({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All</option>
        {values.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
