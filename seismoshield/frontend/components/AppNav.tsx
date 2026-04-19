"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/exterior", label: "Building" },
  { href: "/simulator", label: "Simulator" },
  { href: "/emergency", label: "Emergency" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onResize = () => {
      if (window.matchMedia("(min-width: 768px)").matches) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0a1020]/90 shadow-[0_1px_0_0_rgba(26,86,219,0.12)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2 text-[15px] font-bold tracking-tight text-white transition hover:text-[#5b8def]"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1A56DB] to-[#0d3d99] text-xs font-bold text-white shadow-[0_0_20px_rgba(26,86,219,0.35)]"
            aria-hidden
          >
            S
          </span>
          <span className="hidden sm:inline">
            <span className="text-[#1A56DB] group-hover:text-[#5b8def]">Quarte</span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-0.5 md:flex"
          aria-label="Primary"
        >
          {LINKS.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  active
                    ? "bg-white/[0.12] text-white shadow-inner"
                    : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white/85 hover:bg-white/[0.08] md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      <div
        id="mobile-nav"
        className={`border-t border-white/[0.08] bg-[#0b1224]/98 md:hidden ${
          menuOpen ? "block" : "hidden"
        }`}
      >
        <nav className="flex flex-col gap-0.5 px-4 py-3" aria-label="Mobile primary">
          {LINKS.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-3 text-sm font-medium ${
                  active
                    ? "bg-[#1A56DB]/20 text-white"
                    : "text-white/75 hover:bg-white/[0.06]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
