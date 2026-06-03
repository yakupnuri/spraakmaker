"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BottomNav, TopNav, Logo } from "./Navigation";
import { useProgress } from "@/lib/hooks";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const { progress } = useProgress();
  const uiStyle = progress.settings.uiStyle ?? "modern";
  const isModern = uiStyle === "modern";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("ui-modern", "ui-destijl");
    root.classList.add(`ui-${uiStyle}`);
  }, [uiStyle]);

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
      <div className="min-h-screen flex items-center justify-center bg-[var(--ds-white)]">
        <div className="w-8 h-8 border-[3px] border-[var(--ds-black)] animate-spin border-t-transparent" />
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
      <div className={isModern
        ? "md:hidden sticky top-0 z-50 bg-[var(--ds-white)]/80 backdrop-blur-md border-b border-[var(--border-color-modern)] px-4 py-2 flex items-center shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
        : "md:hidden sticky top-0 z-50 bg-[var(--ds-white)] border-b-[3px] border-[var(--ds-black)] px-4 py-3 flex items-center"
      }>
        <Logo />
      </div>

      {/* Main content */}
      <main
        className="md:min-h-screen pb-16 md:pb-0 md:pt-0"
      >
        {children}
      </main>

      {/* Mobile: bottom nav */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </>
  );
}
