"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface GameShellProps {
  title: string;
  icon?: string;
  scoreChip?: React.ReactNode;
  onClose?: () => void;
  actionBar?: React.ReactNode;
  children: React.ReactNode;
}

export default function GameShell({
  title,
  icon,
  scoreChip,
  onClose,
  actionBar,
  children,
}: GameShellProps) {
  const router = useRouter();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push("/spel");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col relative select-none">
      {/* Sticky Üst Bar */}
      <header className="sticky top-0 z-30 bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          <h1 className="font-bold text-base tracking-tight uppercase">{title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {scoreChip}
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-[var(--surface-2)] flex items-center justify-center font-bold text-lg cursor-pointer transition-colors active:scale-95 text-[var(--text-muted)] hover:text-[var(--text)]"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Ana İçerik */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-4 pb-48 flex flex-col">
        {children}
      </main>

      {/* Sabit Alt Aksiyon Barı (Mobil Alt Navigasyon Barı fixed bottom-0 z-50 ile çakışmaz) */}
      {actionBar && (
        <div className="fixed left-0 right-0 z-40 bottom-[64px] pb-[env(safe-area-inset-bottom)] md:bottom-0 bg-[var(--surface)] border-t border-[var(--border)] p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] flex gap-3">
          <div className="w-full max-w-lg mx-auto flex gap-3">
            {actionBar}
          </div>
        </div>
      )}
    </div>
  );
}
