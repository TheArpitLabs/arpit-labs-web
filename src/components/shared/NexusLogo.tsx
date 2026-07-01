interface NexusLogoProps {
  className?: string;
}

export function NexusLogo({ className }: NexusLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Axiora Logo"
      width={120}
      height={120}
      className={className}
      style={{ objectFit: 'contain' }}
      loading="eager"
      decoding="async"
    />
  );
}
