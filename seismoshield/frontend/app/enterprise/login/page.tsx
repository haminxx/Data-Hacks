"use client";

import { hasEnterpriseSession, setEnterpriseSession } from "@/lib/enterprise-session";
import { ArrowRight, Building2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

export default function EnterpriseLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@seismoshield.com");
  const [password, setPassword] = useState("demo123");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hasEnterpriseSession()) {
      router.replace("/enterprise/dashboard");
      return;
    }
    router.prefetch("/enterprise/dashboard");
    router.prefetch("/enterprise/risk-assessment");
  }, [router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (!email.trim() || !password) return;
    setSubmitting(true);
    window.setTimeout(() => {
      setEnterpriseSession();
      router.push("/enterprise/dashboard");
    }, 450);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#0F172A] px-6 pb-12 pt-24 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(26,86,219,0.22)_0%,rgba(15,23,42,0)_65%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[320px] bg-[radial-gradient(ellipse_at_bottom,rgba(26,86,219,0.15)_0%,rgba(15,23,42,0)_70%)]"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur">
          <Building2 className="h-3.5 w-3.5 text-[#93c5fd]" />
          Enterprise portal
        </div>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Sign in to SeismoShield
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Access the enterprise risk assessment console. Use your corporate
          email; SSO is not required for the demo.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-[#0b1224]/80 p-6 backdrop-blur"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50"
            >
              Work email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="mt-1.5 block w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-[#1A56DB]/60 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/40"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 block w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-[#1A56DB]/60 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/40"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !email.trim() || !password}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1A56DB] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#1A56DB]/30 transition hover:bg-[#1647b3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A56DB] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Authenticating…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-white/40">
            Demo credentials pre-filled for DataHacks @ UCSD
          </p>
        </form>

        <Link
          href="/"
          className="mt-8 block text-center text-sm text-white/45 transition hover:text-white/80"
        >
          ← Back to SeismoShield
        </Link>
      </div>
    </div>
  );
}
