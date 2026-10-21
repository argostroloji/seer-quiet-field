/** Seer mark, redrawn from the Brandbook construction: two interlocking 45° forms make the "S";
 *  the gaps between them read as the two diamond counters (a market's two outcomes). */
export function SeerMark({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path d="M11 3h17.5l-5.2 8H13.6l-3.9 6H1.5z" fill="currentColor" />
      <path d="M21 29H3.5l5.2-8h9.7l3.9-6h8.2z" fill="currentColor" />
    </svg>
  );
}

export function SeerWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <SeerMark size={20} />
      <span className="text-[19px] font-semibold tracking-[-0.04em] leading-none">seer</span>
    </span>
  );
}
