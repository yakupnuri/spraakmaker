"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconKaarten, IconSpel, IconLessen, IconMeer } from "./Icons";
import { useProgress } from "@/lib/hooks";

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
  const { progress } = useProgress();
  const isModern = (progress.settings.uiStyle ?? "modern") === "modern";

  const navClass = isModern
    ? "fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border-color-modern)] bg-[var(--ds-white)] shadow-[0_-4px_12px_rgba(0,0,0,0.03)] py-1"
    : "fixed bottom-0 left-0 right-0 z-50 border-t-[3px] border-[var(--ds-black)] bg-[var(--ds-white)]";

  return (
    <nav className={navClass} style={{ display: "flex" }}>
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        
        const linkClass = isModern
          ? [
              "flex flex-col items-center justify-center py-2 flex-1 gap-1 transition-all duration-200",
              active
                ? "text-[var(--ds-yellow)]"
                : "text-[var(--ds-black)] opacity-60 hover:opacity-100",
            ].join(" ")
          : [
              "flex flex-col items-center justify-center py-2 flex-1 gap-1",
              "border-r-[3px] border-[var(--ds-black)] last:border-r-0",
              active
                ? "bg-[var(--ds-black)] text-[var(--ds-white)]"
                : "bg-[var(--ds-white)] text-[var(--ds-black)]",
            ].join(" ");

        return (
          <Link key={href} href={href} className={linkClass}>
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
      <img src="/spfavicon.png" alt="Spraakmaker Logo" className="w-[46px] h-[46px] rounded-xl flex-shrink-0 object-contain" />
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
  const { progress } = useProgress();
  const isModern = (progress.settings.uiStyle ?? "modern") === "modern";

  const navClass = isModern
    ? "sticky top-0 z-50 border-b border-[var(--border-color-modern)] bg-[var(--ds-white)]/80 backdrop-blur-md flex items-stretch px-4 py-1"
    : "sticky top-0 z-50 border-b-[3px] border-[var(--ds-black)] bg-[var(--ds-white)] flex items-stretch";

  const logoWrapperClass = isModern
    ? "px-4 py-2 flex items-center hover:opacity-80 transition-opacity"
    : "px-6 py-3 border-r-[3px] border-[var(--ds-black)] hover:bg-[var(--ds-gray)] transition-colors flex items-center";

  return (
    <nav className={navClass}>
      {/* Logo */}
      <Link href="/" className={logoWrapperClass}>
        <Logo />
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = isActive(pathname, href);
          
          const linkClass = isModern
            ? [
                "flex items-center px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all duration-200 rounded-full",
                active
                  ? "bg-[rgba(0,173,181,0.08)] text-[var(--ds-yellow)]"
                  : "text-[var(--ds-black)] opacity-70 hover:opacity-100 hover:bg-slate-100/50",
              ].join(" ")
            : [
                "flex items-center px-5 py-4 text-sm font-bold tracking-widest uppercase",
                "border-l-[3px] border-[var(--ds-black)]",
                active
                  ? "bg-[var(--ds-black)] text-[var(--ds-white)]"
                  : "hover:bg-[var(--ds-gray)] transition-colors",
              ].join(" ");

          return (
            <Link key={href} href={href} className={linkClass}>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
