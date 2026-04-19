import Link from "next/link";

export default function EmergencyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-[#1A56DB]">Emergency resources</h1>
      <p className="mt-4 text-sm leading-relaxed text-white/80">
        For the hackathon demo, press{" "}
        <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-xs">
          D
        </kbd>{" "}
        anywhere to open the full-screen emergency walkthrough. The app also
        polls USGS for significant quakes near UCSD every 30 seconds.
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-white/75">
        <li>Drop, cover, and hold on during shaking.</li>
        <li>Use stairs — not elevators — after the event.</li>
        <li>Meet at an open area away from building façades.</li>
      </ul>
      <Link
        href="/"
        className="mt-8 inline-block text-sm font-medium text-[#1A56DB] hover:underline"
      >
        ← Back to home
      </Link>
    </main>
  );
}
