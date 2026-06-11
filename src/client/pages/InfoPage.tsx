import { Database, Layers3, ShieldCheck } from "lucide-react";

export function InfoPage() {
  return (
    <section className="info-page">
      <p className="eyebrow">Information</p>
      <h2>About PCF Overview</h2>
      <p className="info-intro">
        PCF Overview provides a structured workspace for finding, reviewing,
        and comparing product carbon footprint records.
      </p>
      <div className="info-grid">
        <InfoCard
          icon={<Database size={20} />}
          title="Central data source"
          text="All product records are loaded from the connected Supabase database."
        />
        <InfoCard
          icon={<Layers3 size={20} />}
          title="Extensible structure"
          text="The data model is prepared for BOM trees, calculations, and visual analytics."
        />
        <InfoCard
          icon={<ShieldCheck size={20} />}
          title="Controlled access"
          text="Database access is routed through the Node.js API and protected by Supabase policies."
        />
      </div>
    </section>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="info-card">
      {icon}
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}
