import Image from "next/image";

interface NexusLogoProps {
  className?: string;
}

export function NexusLogo({ className }: NexusLogoProps) {
  return (
    <Image 
      src="/logo.png" 
      alt="Axiora Logo"
      width={120} 
      height={120} 
      className={className}
      priority
      style={{ objectFit: 'contain' }}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}
