"use client";

import React from "react";

interface ScoreItem {
  label: string;
  value: string | number;
  tone?: "accent" | "success" | "danger" | "muted" | "warning";
}

interface ScoreBarProps {
  items: ScoreItem[];
}

export default function ScoreBar({ items }: ScoreBarProps) {
  const toneClasses = {
    accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
    success: "bg-[var(--success-soft)] text-[var(--success)]",
    danger: "bg-[var(--danger-soft)] text-[var(--danger)]",
    muted: "bg-[var(--surface-2)] text-[var(--text-muted)]",
    warning: "bg-[rgba(245,158,11,0.12)] text-[var(--warning)]",
  };

  return (
    <div className="w-full flex items-center justify-center gap-2 mb-4 select-none flex-wrap">
      {items.map((item, index) => {
        const tone = item.tone || "muted";
        return (
          <div
            key={index}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${toneClasses[tone]}`}
          >
            <span className="opacity-70 font-bold">{item.label}:</span>
            <span>{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}
