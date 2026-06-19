"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BottomNav, TopNav, Logo } from "./Navigation";
import { useProgress } from "@/lib/hooks";
import { AIChatWidget } from "./AIChatWidget";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const { progress } = useProgress();

  // Tema: Custom event dinleyicisi ve mount aşamasında localStorage kontrolü
  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<"light" | "dark" | "system">;
      const theme = customEvent.detail;
      const root = document.documentElement;
      if (theme === "system") {
        root.removeAttribute("data-theme");
      } else {
        root.setAttribute("data-theme", theme);
      }
    };

    window.addEventListener("spraakmaker-theme-change", handleThemeChange);

    // İlk mount aşamasında localStorage'daki temayı uygula
    try {
      const stored = localStorage.getItem("spraakmaker-progress");
      if (stored) {
        const p = JSON.parse(stored);
        const t = p.settings?.theme ?? "system";
        const root = document.documentElement;
        if (t === "system") {
          root.removeAttribute("data-theme");
        } else {
          root.setAttribute("data-theme", t);
        }
      }
    } catch {}

    return () => {
      window.removeEventListener("spraakmaker-theme-change", handleThemeChange);
    };
  }, []);

  useEffect(() => {
    const onboardingDone = localStorage.getItem("spraakmaker-onboarding") === "done";
    if (!onboardingDone && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
    setChecked(true);
  }, [pathname, router]);

  const isOnboarding = pathname === "/onboarding";

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="w-8 h-8 border-[2px] border-[var(--text)] animate-spin border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Desktop: top nav */}
      <div className="hidden md:block">
        <TopNav />
      </div>

      {/* Mobile: top nav header with logo */}
      <div className="md:hidden sticky top-0 z-50 bg-[var(--surface)]/80 backdrop-blur-md border-b border-[var(--border)] px-4 py-2 flex items-center shadow-[0_2px_8px_rgba(15,23,42,0.01)]">
        <Logo />
      </div>

      {/* Main content */}
      <main className="md:min-h-screen pb-16 md:pb-0 md:pt-0">
        {children}
      </main>

      {/* Floating AI Chat Widget */}
      <AIChatWidget />

      {/* Mobile: bottom nav */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </>
  );
}
