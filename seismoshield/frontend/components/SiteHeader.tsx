"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/exterior", label: "Building" },
  { href: "/simulator", label: "Simulator" },
  { href: "/emergency", label: "Emergency" },
] as const;

const HIDDEN_ROUTES = new Set<string>(["/map"]);

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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-12">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1A56DB]/40 bg-[#1A56DB]/15 text-[#93c5fd] transition group-hover:bg-[#1A56DB]/25">
            <Activity className="h-4 w-4" />
          </span>
          <span className="text-base">
            Seismo<span className="text-[#1A56DB]">Shield</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
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
          href="/map"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#1A56DB] px-4 py-1.5 text-[13px] font-semibold text-white shadow-sm shadow-[#1A56DB]/25 transition hover:bg-[#1647b3]"
        >
          Open map
        </Link>
      </div>
    </header>
  );
}

export default SiteHeader;
