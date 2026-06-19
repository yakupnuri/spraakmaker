"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { loadVerhaalLessen } from "@/lib/gameData";

interface LesContextChipProps {
  // Option to override close action if needed, otherwise defaults to removing search params
  onClose?: () => void;
  // Option to pass lesId directly if not from searchParams
  lesIdOverride?: string;
}

export default function LesContextChip({ onClose, lesIdOverride }: LesContextChipProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const bron = searchParams.get("bron");
  const lesId = lesIdOverride || searchParams.get("les");

  const [titel, setTitel] = useState<string>("");

  useEffect(() => {
    if (!lesId) return;
    loadVerhaalLessen().then((lessen) => {
      const found = lessen.find((l) => l.lesId === lesId);
      if (found) {
        setTitel(found.titel);
      }
    });
  }, [lesId]);

  if (!lesId) return null;
  // If not overridden and bron is not verhaal, don't show (unless it's in kaarten, where bron might not be verhaal, we can check path or props)
  const isKaarten = pathname.includes("/kaarten");
  if (!lesIdOverride && !isKaarten && bron !== "verhaal") return null;

  const displayNum = lesId.replace("les_", "");

  const handleRemove = () => {
    if (onClose) {
      onClose();
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete("les");
    params.delete("bron");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="flex items-center gap-2 self-start my-2 bg-[var(--accent-soft)] text-[var(--accent)] rounded-full px-3 py-1 text-xs font-bold border border-[color-mix(in_srgb,var(--accent)_15%,transparent)] transition-all">
      <span className="flex items-center gap-1">
        📖 Les {displayNum} {titel ? `· ${titel}` : ""}
      </span>
      <button
        onClick={handleRemove}
        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] transition-colors text-xs font-normal ml-1 cursor-pointer"
        title="Verwijderen"
      >
        ✕
      </button>
    </div>
  );
}
