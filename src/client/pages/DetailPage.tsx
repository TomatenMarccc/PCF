import {
  ArrowLeft,
  Boxes,
  Check,
  CircleCheck,
  Copy,
  LoaderCircle,
  Network,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { confirmPart, getPart } from "../api";
import { formatPcf, formatPercent } from "../components/PartCard";
import type { Part } from "../types";

export function DetailPage() {
  const { id } = useParams();
  const [part, setPart] = useState<Part>();
  const [error, setError] = useState<string>();
  const [bomOpen, setBomOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string>();

  useEffect(() => {
    if (!id) {
      return;
    }

    const controller = new AbortController();
    getPart(id, controller.signal)
      .then(setPart)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Part details could not be loaded.",
          );
        }
      });
    return () => controller.abort();
  }, [id]);

  async function copyPartNumber() {
    if (!part) return;
    await navigator.clipboard.writeText(part.part_number);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function confirmPcf() {
    if (!part || part.status === "Complete" || confirming) {
      return;
    }

    setConfirming(true);
    setConfirmError(undefined);

    try {
      setPart(await confirmPart(part.id));
    } catch (requestError) {
      setConfirmError(
        requestError instanceof Error
          ? requestError.message
          : "The PCF could not be confirmed.",
      );
    } finally {
      setConfirming(false);
    }
  }

  if (error) {
    return (
      <div className="state-panel detail-state">
        <h2>Part unavailable</h2>
        <p>{error}</p>
        <Link className="secondary-button" to="/">
          Return to overview
        </Link>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="state-panel detail-state">
        <LoaderCircle className="spin" size={24} />
        <p>Loading part details...</p>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <div className="detail-toolbar">
        <Link to="/" className="back-link">
          <ArrowLeft size={17} />
          Back to overview
        </Link>
        <div className="detail-actions">
          <button
            className="confirm-button"
            onClick={confirmPcf}
            disabled={part.status === "Complete" || confirming}
          >
            {confirming ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <CircleCheck size={17} />
            )}
            {part.status === "Complete" ? "PCF confirmed" : "Confirm PCF"}
          </button>
          <button className="primary-button" onClick={() => setBomOpen(true)}>
            <Network size={17} />
            BOM-Tree
          </button>
        </div>
      </div>

      {confirmError && (
        <div className="inline-error" role="alert">
          {confirmError}
        </div>
      )}

      <header className="detail-header">
        <div>
          <p className="eyebrow">Part detail</p>
          <h2>{part.name}</h2>
          <div className="part-number">
            <span>{part.part_number}</span>
            <button
              className="copy-button"
              onClick={copyPartNumber}
              title="Copy Part Number"
              aria-label="Copy Part Number"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
        </div>
        <span className={`status-badge status-${part.status.toLowerCase().replace(" ", "-")}`}>
          {part.status}
        </span>
      </header>

      <div className="detail-grid">
        <section className="detail-data-panel">
          <div className="detail-metrics">
            <div>
              <span>BOM-Coverage</span>
              <strong>{formatPercent(part.bom_coverage)}</strong>
              <div className="progress-track">
                <span style={{ width: `${part.bom_coverage}%` }} />
              </div>
            </div>
            <div>
              <span>PCF Total</span>
              <strong>{formatPcf(part.pcf_total)}</strong>
            </div>
          </div>

          <h3>Part information</h3>
          <dl className="detail-list">
            <Detail label="Plant Code" value={part.plant_code} />
            <Detail label="Product Class" value={part.product_class} />
            <Detail label="Calculation Method" value={part.calculation_method} />
            <Detail label="Reference Year" value={String(part.reference_year)} />
            <Detail label="Validity Year" value={String(part.validity_year)} />
            <Detail
              label="Primary Data Share"
              value={formatPercent(part.primary_data_share)}
            />
            <Detail
              label="CX Data Quality Rating Total"
              value={Number(part.cx_data_quality_rating_total).toFixed(2)}
            />
            <Detail
              label="PCF Calculation Version"
              value={part.pcf_calculation_version}
            />
          </dl>
        </section>

        <section className="chart-grid" aria-label="Future data visualizations">
          {[
            "Emission composition",
            "BOM contribution",
            "Data quality trend",
            "PCF development",
          ].map((title) => (
            <article className="chart-placeholder" key={title}>
              <div>
                <Boxes size={19} />
                <span>Visualization pipeline</span>
              </div>
              <h3>{title}</h3>
              <div className="chart-skeleton" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <p>Graph data will be connected in a future iteration.</p>
            </article>
          ))}
        </section>
      </div>

      {bomOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setBomOpen(false)}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bom-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <p className="eyebrow">Future visualization</p>
                <h2 id="bom-title">BOM-Tree</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setBomOpen(false)}
                aria-label="Close BOM-Tree"
              >
                <X size={19} />
              </button>
            </header>
            <div className="bom-placeholder">
              <Network size={34} />
              <h3>BOM tree visualization area</h3>
              <p>
                The component pipeline is ready for hierarchical BOM data.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
