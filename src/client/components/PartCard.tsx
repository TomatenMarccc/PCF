import { Check, Copy, MoveRight } from "lucide-react";
import { memo, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";

import type { Part } from "../types";

interface PartCardProps {
  part: Part;
}

function PartCardComponent({ part }: PartCardProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  async function copyPartNumber(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    await navigator.clipboard.writeText(part.part_number);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <article
      className="part-card"
      tabIndex={0}
      role="link"
      onClick={() => navigate(`/parts/${part.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          navigate(`/parts/${part.id}`);
        }
      }}
    >
      <div className="card-header">
        <div>
          <p className="eyebrow">Part</p>
          <h3>{part.name}</h3>
          <div className="part-number">
            <span>{part.part_number}</span>
            <button
              type="button"
              className="copy-button"
              onClick={copyPartNumber}
              title="Copy Part Number"
              aria-label="Copy Part Number"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
        </div>
        <MoveRight className="card-arrow" size={19} aria-hidden="true" />
      </div>

      <div className="key-metrics">
        <div className="metric status-metric">
          <span className="metric-label">Status</span>
          <span className={`status-badge status-${part.status.toLowerCase().replace(" ", "-")}`}>
            {part.status}
          </span>
        </div>
        <div className="metric coverage-metric">
          <div className="metric-heading">
            <span className="metric-label">BOM-Coverage</span>
            <strong>{formatPercent(part.bom_coverage)}</strong>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="BOM coverage"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={part.bom_coverage}
          >
            <span style={{ width: `${part.bom_coverage}%` }} />
          </div>
        </div>
        <div className="metric pcf-metric">
          <span className="metric-label">PCF Total</span>
          <strong>{formatPcf(part.pcf_total)}</strong>
        </div>
      </div>

      <dl className="metadata-grid">
        <Metadata label="Plant Code" value={part.plant_code} />
        <Metadata label="Product Class" value={part.product_class} />
        <Metadata label="Calculation Method" value={part.calculation_method} />
        <Metadata label="Reference Year" value={String(part.reference_year)} />
        <Metadata label="Validity Year" value={String(part.validity_year)} />
      </dl>
    </article>
  );
}

export const PartCard = memo(PartCardComponent);

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function formatPcf(value: number): string {
  return `${Number(value).toFixed(2)} kgCO2eq./pcs`;
}

export function formatPercent(value: number): string {
  return `${Number(value).toFixed(value % 1 === 0 ? 0 : 1)}%`;
}
