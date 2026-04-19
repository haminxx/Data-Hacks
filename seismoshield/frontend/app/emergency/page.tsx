import Link from "next/link";

import { PageHeader } from "@/components/PageHeader";

export default function EmergencyPage() {
  return (
    <div className="flex flex-1 flex-col px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-2xl flex-1">
        <PageHeader
          eyebrow="Safety"
          title="Emergency resources"
          description="Know what to do during shaking and where to gather after. The in-app takeover (press D) mirrors these steps for the hackathon demo."
          breadcrumbs={[
            { href: "/", label: "Home" },
            { href: "/emergency", label: "Emergency" },
          ]}
        />

        <div className="mt-8 space-y-4 rounded-2xl border border-white/[0.08] bg-surface-raised/50 p-6 shadow-card">
          <h2 className="text-sm font-semibold text-white">During an earthquake</h2>
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-white/75">
            <li>
              <strong className="text-white">Drop</strong> — hands and knees,
              protect your neck.
            </li>
            <li>
              <strong className="text-white">Cover</strong> — under sturdy
              furniture if possible.
            </li>
            <li>
              <strong className="text-white">Hold on</strong> — until shaking
              stops.
            </li>
          </ol>
        </div>

        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
          <h2 className="text-sm font-semibold text-red-200">Demo mode</h2>
          <p className="mt-2 text-sm text-red-100/80">
            Press{" "}
            <kbd className="rounded border border-red-400/30 bg-red-950/50 px-2 py-0.5 font-mono text-xs">
              D
            </kbd>{" "}
            on any page to open the full-screen emergency flow with sample Salton
            Sea data. The app also checks USGS periodically for significant
            earthquakes near campus.
          </p>
        </div>

        <Link
          href="/exterior"
          className="mt-10 inline-flex items-center gap-2 text-sm font-medium text-brand-bright hover:underline"
        >
          ← Back to building view
        </Link>
      </div>
    </div>
  );
}
