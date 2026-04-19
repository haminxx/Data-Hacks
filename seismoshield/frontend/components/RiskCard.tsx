export type RiskCardProps = {
  pgv: number;
  tier: string;
  color: string;
  description: string;
  building_tips: string[];
};

/** Maps seismic risk tier → insurance band (demo / hackathon UX). */
function insuranceBadge(tier: string): { label: string; className: string } {
  switch (tier) {
    case "Severe":
      return {
        label: "Tier 1 — Specialist Coverage Required",
        className:
          "border-red-500 bg-red-950/50 text-red-300 ring-1 ring-inset ring-red-500/30",
      };
    case "High":
      return {
        label: "Tier 2 — High Risk Surcharge",
        className:
          "border-orange-500 bg-orange-950/50 text-orange-200 ring-1 ring-inset ring-orange-500/30",
      };
    case "Moderate":
      return {
        label: "Tier 3 — Standard Rate",
        className:
          "border-yellow-500 bg-yellow-950/50 text-yellow-200 ring-1 ring-inset ring-yellow-500/30",
      };
    case "Low":
      return {
        label: "Tier 4 — Low Risk Rate",
        className:
          "border-green-500 bg-green-950/50 text-green-200 ring-1 ring-inset ring-green-500/30",
      };
    case "Very Low":
      return {
        label: "Tier 4 — Low Risk Rate",
        className:
          "border-green-500 bg-green-950/50 text-green-200 ring-1 ring-inset ring-green-500/30",
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
  const tips = building_tips?.length ? building_tips : [];

  return (
    <article
      className="flex flex-col rounded-xl border border-white/10 bg-[#0F172A] p-5 shadow-lg"
      style={{ borderLeftWidth: "4px", borderLeftColor: color }}
    >
      <h2
        className="text-3xl font-bold tracking-tight sm:text-4xl"
        style={{ color }}
      >
        {tier}
      </h2>

      <p className="mt-4 text-base text-white/90">
        Peak Ground Velocity:{" "}
        <span className="font-semibold tabular-nums text-white">
          {pgv.toFixed(1)} cm/s
        </span>
      </p>

      <p className="mt-4 text-sm leading-relaxed text-white/80">{description}</p>

      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">
          Building-Specific Risks
        </h3>
        {tips.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-white/85">
            {tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-white/45">No tips listed.</p>
        )}
      </div>

      <div
        className={`mt-6 inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-medium ${badge.className}`}
      >
        {badge.label}
      </div>
    </article>
  );
}
