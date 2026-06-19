"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconKaarten, IconSpel, IconLessen, IconMeer, IconVideo } from "./Icons";

const NAV_ITEMS = [
  { href: "/", label: "HOME", Icon: IconHome },
  { href: "/lessen", label: "LESSEN", Icon: IconLessen },
  { href: "/kaarten", label: "KAARTEN", Icon: IconKaarten },
  { href: "/videos", label: "VIDEOS", Icon: IconVideo },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--surface)] shadow-[0_-4px_16px_rgba(0,0,0,0.04)] rounded-t-3xl pb-[env(safe-area-inset-bottom)] flex items-center justify-around h-[64px] px-6 select-none">
      {NAV_ITEMS.map(({ href, Icon }) => {
        const active = isActive(pathname, href);
        
        const linkClass = [
          "flex items-center justify-center p-3 transition-all duration-200 rounded-full active:scale-90",
          active
            ? "text-[var(--accent)]"
            : "text-[var(--text-muted)] opacity-70 hover:opacity-100",
        ].join(" ");

        return (
          <Link key={href} href={href} className={linkClass}>
            <Icon size={22} />
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
      <div className="flex flex-col select-none text-left justify-center">
        <span className="text-3xl font-bold tracking-tight text-[var(--text)] font-sans leading-none lowercase">
          spraakmaker
        </span>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[8px] font-black tracking-widest text-[var(--text)] opacity-60 uppercase leading-none">
            DÉ APP OM NEDERLANDS TE LEREN
          </span>
          <div className="h-[2px] w-6 bg-[var(--accent)] flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md flex items-stretch px-4 py-1">
      <Link href="/" className="px-4 py-2 flex items-center hover:opacity-80 transition-opacity">
        <Logo />
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = isActive(pathname, href);
          
          const linkClass = [
            "flex items-center px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all duration-200 rounded-full",
            active
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "text-[var(--text)] opacity-70 hover:opacity-100 hover:bg-slate-100/50",
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
