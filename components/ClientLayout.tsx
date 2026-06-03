"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BottomNav, TopNav } from "./Navigation";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

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
