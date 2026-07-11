"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LANDING_URL, NAV_ITEMS } from "@/lib/constants";

interface AppShellProps {
  children: React.ReactNode;
  health?: { smConnected: boolean; memoryCount: number };
}

const PRIMARY_NAV = NAV_ITEMS.filter((n) => n.primary);
const MORE_NAV = NAV_ITEMS.filter((n) => !n.primary);

export function AppShell({ children, health }: AppShellProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="app-header">
        <a href={LANDING_URL} className="brand">
          <span className="memory-knot" aria-hidden="true" />
          RECALL
        </a>

        <nav className="app-nav" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link${isActive(item.href) ? " active" : ""}${item.ready ? "" : " dim"}`}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="app-header-end">
          <span className="live-badge" title="Running on your machine">
            {health?.smConnected === false ? "Offline" : "Local"}
          </span>
          <a href={LANDING_URL} className="nav-link about-link" title="About RECALL">
            About
          </a>
        </div>
      </header>

      <main className="app-main">{children}</main>

      <nav className="app-bottom-nav" aria-label="Mobile navigation">
        {PRIMARY_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-link${isActive(item.href) ? " active" : ""}`}
            aria-current={isActive(item.href) ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          className={`bottom-link${moreOpen ? " active" : ""}`}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((v) => !v)}
        >
          More
        </button>
      </nav>

      {moreOpen && (
        <>
          <button type="button" className="sheet-overlay" aria-label="Close" onClick={() => setMoreOpen(false)} />
          <div className="more-sheet" role="dialog" aria-label="More pages">
            {MORE_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sheet-link${isActive(item.href) ? " active" : ""}`}
                onClick={() => setMoreOpen(false)}
              >
                {item.label}
                {!item.ready ? <span className="sheet-soon">Soon</span> : null}
              </Link>
            ))}
            <a href={LANDING_URL} className="sheet-link" onClick={() => setMoreOpen(false)}>
              About RECALL
            </a>
          </div>
        </>
      )}
    </>
  );
}