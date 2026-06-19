"use client";

import React from "react";

interface GameProgressProps {
  current: number;
  total: number;
  label?: string;
}

export default function GameProgress({ current, total, label }: GameProgressProps) {
  const percent = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
  return (
    <div className="w-full flex flex-col gap-1.5 mb-4 select-none">
      <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-black">
        <span>{label || "Progress"}</span>
        <span>{current} / {total}</span>
      </div>
      <div className="w-full h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-300 rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
