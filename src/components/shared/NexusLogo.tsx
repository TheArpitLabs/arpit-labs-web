interface NexusLogoProps {
  className?: string;
  size?: number;
}

export function NexusLogo({ className, size = 120 }: NexusLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 120 120" 
      fill="none" 
      className={className} 
      aria-hidden="true" 
      role="img"
    >
      <defs>
        <linearGradient id="nexus-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="22" fill="url(#nexus-gradient)" opacity="0.92" />
      <circle cx="60" cy="60" r="10" fill="white" opacity="0.9" />
      <path d="M60 38L60 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M60 102L60 82" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M38 60L18 60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M102 60L82 60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="18" r="6" fill="currentColor" />
      <circle cx="60" cy="102" r="6" fill="currentColor" />
      <circle cx="18" cy="60" r="6" fill="currentColor" />
      <circle cx="102" cy="60" r="6" fill="currentColor" />
      <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.7" />
      <circle cx="96" cy="24" r="3" fill="currentColor" opacity="0.7" />
      <circle cx="24" cy="96" r="3" fill="currentColor" opacity="0.7" />
      <circle cx="96" cy="96" r="3" fill="currentColor" opacity="0.7" />
    </svg>
  );
}
