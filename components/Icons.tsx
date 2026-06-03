"use client";

// Geometric SVG icons — De Stijl style, no emoji, no icon libraries

export function IconHome({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
      <rect x="1" y="1" width="8" height="8" />
      <rect x="11" y="1" width="8" height="8" />
      <rect x="1" y="11" width="8" height="8" />
      <rect x="11" y="11" width="8" height="8" />
    </svg>
  );
}

export function IconKaarten({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="16" height="12" />
      <line x1="2" y1="8" x2="18" y2="8" />
    </svg>
  );
}

export function IconSpel({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
      <polygon points="4,2 18,10 4,18" />
    </svg>
  );
}

export function IconLessen({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
      <rect x="2" y="3" width="16" height="3" />
      <rect x="2" y="9" width="16" height="3" />
      <rect x="2" y="15" width="16" height="3" />
    </svg>
  );
}

export function IconMeer({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
      <rect x="8.5" y="2" width="3" height="3" />
      <rect x="8.5" y="8.5" width="3" height="3" />
      <rect x="8.5" y="15" width="3" height="3" />
    </svg>
  );
}

export function IconCheck({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="3,10 8,16 17,4" />
    </svg>
  );
}

export function IconX({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3">
      <line x1="3" y1="3" x2="17" y2="17" />
      <line x1="17" y1="3" x2="3" y2="17" />
    </svg>
  );
}

export function IconMinus({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3">
      <line x1="3" y1="10" x2="17" y2="10" />
    </svg>
  );
}

export function IconArrowRight({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <line x1="2" y1="10" x2="18" y2="10" />
      <polyline points="11,3 18,10 11,17" />
    </svg>
  );
}
