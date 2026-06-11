import { Database, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { getFilterOptions, getParts } from "../api";
import { FilterPanel } from "../components/FilterPanel";
import { PartCard } from "../components/PartCard";
import type { FilterOptions, Part, PartFilters } from "../types";

const EMPTY_FILTERS: PartFilters = {
  partNumber: "",
  plantCode: "",
  referenceYear: "",
  calculationMethod: "",
  productClass: "",
};

const EMPTY_OPTIONS: FilterOptions = {
  plantCodes: [],
  referenceYears: [],
  calculationMethods: [],
  productClasses: [],
};

export function OverviewPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [debouncedFilters, setDebouncedFilters] = useState(EMPTY_FILTERS);
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [parts, setParts] = useState<Part[]>([]);
  const [count, setCount] = useState(0);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedFilters(filters), 400);
    return () => window.clearTimeout(timeout);
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();
    getFilterOptions(controller.signal)
      .then(setOptions)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Filter options could not be loaded.",
          );
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(undefined);

    getParts(debouncedFilters, limit, controller.signal)
      .then((result) => {
        setParts(result.data);
        setCount(result.count);
        setHasLoaded(true);
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Parts could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [debouncedFilters, limit]);

  return (
    <div className="overview-layout">
      <FilterPanel filters={filters} options={options} onChange={setFilters} />

      <section className="results-panel">
        <div className="results-heading">
          <div>
            <p className="eyebrow">Live data overview</p>
            <h2>Your Preview</h2>
            <div className="result-summary" aria-live="polite">
              <p>
                {count} {count === 1 ? "record" : "records"} found
              </p>
              {loading && hasLoaded && (
                <span className="updating-indicator">
                  <LoaderCircle className="spin" size={13} />
                  Updating
                </span>
              )}
            </div>
          </div>
          <div className="database-state">
            <span />
            Supabase connected
          </div>
        </div>

        {loading && !hasLoaded ? (
          <div className="state-panel">
            <LoaderCircle className="spin" size={24} />
            <p>Loading PCF records...</p>
          </div>
        ) : error && !hasLoaded ? (
          <div className="state-panel error-state">
            <Database size={24} />
            <h3>Data connection unavailable</h3>
            <p>{error}</p>
          </div>
        ) : parts.length === 0 ? (
          <div className="state-panel">
            <Database size={24} />
            <h3>No parts found.</h3>
            <p>Adjust the search or filter criteria and try again.</p>
          </div>
        ) : (
          <div className="card-list">
            {parts.map((part) => (
              <PartCard key={part.id} part={part} />
            ))}
          </div>
        )}

        {error && hasLoaded && (
          <div className="results-inline-error" role="alert">
            Results could not be updated. The previous results remain visible.
          </div>
        )}

        <div className="results-footer">
          <span>
            Showing {Math.min(parts.length, limit)} of {count}
          </span>
          <label>
            Results per page
            <select
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
      </section>
    </div>
  );
}
