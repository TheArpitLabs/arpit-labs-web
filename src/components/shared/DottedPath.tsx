interface DottedPathProps {
  className?: string;
}

export function DottedPath({ className }: DottedPathProps) {
  return (
    <svg viewBox="0 0 280 120" fill="none" aria-hidden="true" className={className}>
      <path d="M14 20C74 36 154 18 190 46C218 68 218 82 256 96" stroke="currentColor" strokeWidth="2" strokeDasharray="6 10" strokeLinecap="round" />
      <circle cx="14" cy="20" r="4" fill="currentColor" />
      <circle cx="256" cy="96" r="4" fill="currentColor" />
    </svg>
  );
}
