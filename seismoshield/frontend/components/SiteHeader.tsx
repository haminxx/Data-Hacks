"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/risk", label: "Risk Assessment" },
  { href: "/simulator", label: "Simulator" },
  { href: "/emergency", label: "Emergency" },
] as const;

const HIDDEN_ROUTES = new Set<string>(["/map"]);

function navItemActive(href: string, pathname: string): boolean {
  if (href === "/risk") {
    return pathname === "/risk" || pathname.startsWith("/risk/");
  }
  return pathname === href;
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  if (HIDDEN_ROUTES.has(pathname)) return null;

  const transparent = pathname === "/";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 ${
        transparent
          ? "bg-transparent"
          : "border-b border-white/[0.06] bg-[#0B1220]/80 backdrop-blur-md"
      }`}
    >
      {/* 3-column grid: logo | centered nav | enterprise CTA. Using grid
          here instead of flex justify-between so the nav cluster sits
          EXACTLY at the viewport horizontal center regardless of how
          wide the logo or CTA grow. */}
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-6 md:px-12">
        <Link
          href="/"
          className="group inline-flex min-w-0 items-center gap-2 justify-self-start text-sm font-semibold tracking-tight text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1A56DB]/40 bg-[#1A56DB]/15 text-[#93c5fd] transition group-hover:bg-[#1A56DB]/25">
            <Activity className="h-4 w-4" />
          </span>
          <span className="text-base">
            <span className="text-[#1A56DB]">Quarte</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 justify-self-center md:flex">
          {NAV_ITEMS.map((item) => {
            const active = navItemActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
                {active && (
                  <span className="pointer-events-none absolute inset-x-4 -bottom-[1px] h-[2px] rounded-full bg-[#1A56DB]" />
                )}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/enterprise/login"
          className="inline-flex items-center gap-1.5 justify-self-end rounded-full bg-[#1A56DB] px-4 py-1.5 text-[13px] font-semibold text-white shadow-sm shadow-[#1A56DB]/25 transition hover:bg-[#1647b3]"
        >
          Enterprise
        </Link>
      </div>
    </header>
  );
}

export default SiteHeader;
