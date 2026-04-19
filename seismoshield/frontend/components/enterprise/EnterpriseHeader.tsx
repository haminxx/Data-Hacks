"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { clearEnterpriseSession } from "@/lib/enterprise-session";

type EnterpriseHeaderProps = {
  /** Shown in the center (e.g. portfolio title or breadcrumb). */
  center?: React.ReactNode;
};

export function EnterpriseHeader({ center }: EnterpriseHeaderProps) {
  const router = useRouter();

  const signOut = () => {
    clearEnterpriseSession();
    router.push("/enterprise/login");
  };

  return (
    <header className="border-b border-white/[0.08] bg-[#0F172A]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <Link
          href="/enterprise/dashboard"
          className="shrink-0 text-sm font-semibold text-[#1A56DB] md:text-base"
        >
          SeismoShield Enterprise
        </Link>

        {center != null && (
          <div className="min-w-0 flex-1 text-sm text-white/80 md:text-center">
            {center}
          </div>
        )}

        <div className="flex shrink-0 items-center gap-3 text-sm md:justify-end">
          <span className="hidden text-white/60 sm:inline">
            demo@seismoshield.com
          </span>
          <button
            type="button"
            onClick={signOut}
            className="rounded-lg border border-white/15 px-3 py-1 text-white/80 transition hover:bg-white/5"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
