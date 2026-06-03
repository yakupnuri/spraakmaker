"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconKaarten, IconSpel, IconLessen, IconMeer } from "./Icons";

const NAV_ITEMS = [
  { href: "/", label: "HOME", Icon: IconHome },
  { href: "/lessen", label: "LESSEN", Icon: IconLessen },
  { href: "/kaarten", label: "KAARTEN", Icon: IconKaarten },
  { href: "/spel", label: "SPEL", Icon: IconSpel },
  { href: "/meer", label: "MEER", Icon: IconMeer },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t-[3px] border-[var(--ds-black)] bg-[var(--ds-white)]"
      style={{ display: "flex" }}
    >
      {NAV_ITEMS.map(({ href, label, Icon }, i) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={[
              "flex flex-col items-center justify-center py-2 flex-1 gap-1",
              "border-r-[3px] border-[var(--ds-black)] last:border-r-0",
              active
                ? "bg-[var(--ds-black)] text-[var(--ds-white)]"
                : "bg-[var(--ds-white)] text-[var(--ds-black)]",
            ].join(" ")}
          >
            <Icon size={18} />
            <span className="text-[9px] font-bold tracking-widest uppercase leading-none">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      {/* SVG Logo İkonu */}
      <svg width="46" height="46" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        <rect width="100" height="100" rx="24" fill="#1A1A1A" />
        
        {/* Üst dalga (Kırmızı) */}
        <path d="M 24 38 C 24 28, 38 28, 55 28 H 76 C 76 28, 78 32, 70 36 C 60 40, 44 42, 36 46 C 30 50, 24 45, 24 38 Z" fill="#C23B22" />
        
        {/* Orta dalga (Beyaz) */}
        <path d="M 24 50 C 24 42, 34 38, 56 38 C 66 38, 76 44, 76 50 C 76 56, 66 62, 44 62 C 34 62, 24 58, 24 50 Z" fill="#F5F2EB" />
        
        {/* Alt dalga (Sarı) */}
        <path d="M 76 62 C 76 72, 62 72, 45 72 H 24 C 24 72, 22 68, 30 64 C 40 60, 56 58, 64 54 C 70 50, 76 55, 76 62 Z" fill="#F2C12E" />
      </svg>
      {/* Yazılar */}
      <div className="flex flex-col select-none text-left justify-center">
        <span className="text-3xl font-bold tracking-tight text-[var(--ds-black)] font-sans leading-none lowercase">
          spraakmaker
        </span>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[8px] font-black tracking-widest text-[var(--ds-black)] opacity-60 uppercase leading-none">
            DÉ APP OM NEDERLANDS TE LEREN
          </span>
          <div className="h-[2px] w-6 bg-[var(--ds-yellow)] flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b-[3px] border-[var(--ds-black)] bg-[var(--ds-white)] flex items-stretch">
      {/* Logo */}
      <Link
        href="/"
        className="px-6 py-3 border-r-[3px] border-[var(--ds-black)] hover:bg-[var(--ds-gray)] transition-colors flex items-center"
      >
        <Logo />
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Nav links */}
      <div className="flex items-stretch">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center px-5 py-4 text-sm font-bold tracking-widest uppercase",
                "border-l-[3px] border-[var(--ds-black)]",
                active
                  ? "bg-[var(--ds-black)] text-[var(--ds-white)]"
                  : "hover:bg-[var(--ds-gray)] transition-colors",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
