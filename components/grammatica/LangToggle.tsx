"use client";

interface LangToggleProps {
  langNL: boolean;
  moedertaal: string;
  hasTranslation: boolean;
  onToggle: () => void;
}

export default function LangToggle({
  langNL,
  moedertaal,
  hasTranslation,
  onToggle,
}: LangToggleProps) {
  if (!hasTranslation) return null;
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation();
          e.preventDefault();
          onToggle();
        }
      }}
      title={langNL ? "Lees in jouw taal" : "Lees in het Nederlands"}
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest cursor-pointer rounded-full transition-all duration-200 select-none ${
        langNL
          ? "bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--accent)] hover:text-black"
          : "bg-[var(--accent)] text-black shadow-sm"
      }`}
    >
      <span className={langNL ? "opacity-40" : "font-bold"}>NL</span>
      <span className="opacity-30">/</span>
      <span className={!langNL ? "opacity-40" : "font-bold"}>{moedertaal.toUpperCase()}</span>
    </span>
  );
}
