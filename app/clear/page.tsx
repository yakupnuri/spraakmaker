"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ClearStoragePage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.clear();
    router.replace("/onboarding");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] text-[#0f172a]">
      <div className="text-center flex flex-col gap-2">
        <div className="w-8 h-8 border-[2px] border-[#0f2d4a] animate-spin border-t-transparent rounded-full mx-auto" />
        <p className="text-xs font-bold text-[#64748b] mt-2">Lokal depolama temizleniyor ve onboarding ekranına yönlendiriliyorsunuz...</p>
      </div>
    </div>
  );
}
