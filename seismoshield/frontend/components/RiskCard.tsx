type RiskCardProps = {
  pgv: number;
  tier: string;
  color: string;
  description: string;
  building_tips: string[];
};

function insuranceBadge(tier: string): { label: string; className: string } {
  switch (tier) {
    case "Severe":
      return {
        label: "Tier 1 — Specialist Coverage Required",
        className: "border-red-500/50 bg-red-950/40 text-red-300",
      };
    case "High":
      return {
        label: "Tier 2 — High Risk Surcharge",
        className: "border-orange-500/50 bg-orange-950/40 text-orange-200",
      };
    case "Moderate":
      return {
        label: "Tier 3 — Standard Rate",
        className: "border-yellow-500/50 bg-yellow-950/40 text-yellow-200",
      };
    case "Low":
    case "Very Low":
      return {
        label: "Tier 4 — Low Risk Rate",
        className: "border-emerald-500/50 bg-emerald-950/40 text-emerald-200",
      };
    default:
      return {
        label: "Tier 3 — Standard Rate",
        className: "border-white/20 bg-white/5 text-white/80",
      };
  }
}

export function RiskCard({
  pgv,
  tier,
  color,
  description,
  building_tips,
}: RiskCardProps) {
  const badge = insuranceBadge(tier);

  return (
    <article
      className="rounded-xl border border-white/10 bg-[#0b1224] p-5 shadow-lg"
      style={{ borderLeftWidth: "4px", borderLeftColor: color }}
    >
      <h2 className="text-2xl font-bold tracking-tight" style={{ color }}>
        {tier}
      </h2>
      <p className="mt-3 text-sm text-white/90">
        Peak Ground Velocity:{" "}
        <span className="font-semibold text-white">
          {pgv.toFixed(1)} cm/s
        </span>
      </p>
      <p className="mt-4 text-sm leading-relaxed text-white/80">{description}</p>

      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">
          Building-Specific Risks
        </h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-white/85">
          {building_tips.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      </div>

      <div
        className={`mt-6 inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${badge.className}`}
      >
        {badge.label}
      </div>
    </article>
  );
}
