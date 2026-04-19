"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // IMPORTANT: every hook must run on every render to keep React's hook
  // ordering stable. The route-based bail-out happens AFTER all hooks so
  // navigating between "/" and "/map" never changes the hook count.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = menuRef.current;
      if (el && !el.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 md:px-12">
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

        {/* Mobile / narrow: menu — desktop keeps centered nav in column 2 */}
        <div className="relative justify-self-end md:col-start-3" ref={menuRef}>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="site-header-mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {menuOpen && (
            <div
              id="site-header-mobile-menu"
              role="menu"
              className="absolute right-0 top-12 z-50 min-w-[220px] rounded-2xl border border-white/10 bg-[#0b1426]/95 py-2 shadow-2xl shadow-black/40 backdrop-blur-xl md:hidden"
            >
              {NAV_ITEMS.map((item) => {
                const active = navItemActive(item.href, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className={`block px-4 py-2.5 text-[14px] font-medium transition ${
                      active
                        ? "bg-white/10 text-white"
                        : "text-white/80 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* md+: keep grid balanced (nav centered in col 2; col 3 spacer ≈ hamburger width) */}
          <span className="hidden w-10 md:block" aria-hidden />
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
