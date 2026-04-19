import Link from "next/link";

const DEFAULT_ADDRESS =
  "UCSD Recreation Center, 9500 Gilman Dr, La Jolla, CA 92093";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12 sm:py-16">
      <div className="landing-pulse-bg pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="landing-pulse-ring landing-pulse-ring--1" />
        <span className="landing-pulse-ring landing-pulse-ring--2" />
        <span className="landing-pulse-ring landing-pulse-ring--3" />
        <span className="landing-pulse-ring landing-pulse-ring--4" />
      </div>

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <h1 className="text-4xl font-bold tracking-tight text-[#1A56DB] sm:text-5xl md:text-6xl">
          SeismoShield
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-white/90 sm:text-lg">
          We know your building. We know your risk. We get you out safely.
        </p>

        <label htmlFor="building-address" className="sr-only">
          Building address
        </label>
        <input
          id="building-address"
          name="address"
          type="text"
          defaultValue={DEFAULT_ADDRESS}
          className="mt-10 w-full rounded-lg border border-white/10 bg-[#0F172A]/80 px-4 py-3 text-left text-sm text-white shadow-inner backdrop-blur-sm placeholder:text-white/40 focus:border-[#1A56DB]/50 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 sm:text-base"
          autoComplete="street-address"
        />

        <Link
          href="/exterior"
          className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#1A56DB] px-6 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-[#1647b3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A56DB] sm:w-auto sm:min-w-[240px]"
        >
          Analyze This Building
        </Link>

        <div className="mt-10 flex max-w-md flex-wrap items-center justify-center gap-2 sm:gap-3">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/85 sm:text-sm">
            🌍 Risk Assessment
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/85 sm:text-sm">
            🏗️ 3D Simulation
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/85 sm:text-sm">
            🚨 Emergency Guidance
          </span>
        </div>
      </div>
    </main>
  );
}
