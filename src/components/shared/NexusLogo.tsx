import Image from "next/image";

interface NexusLogoProps {
  className?: string;
  size?: number;
}

export function NexusLogo({ className, size = 120 }: NexusLogoProps) {
  return (
    <Image 
      src="/logo.png" 
      alt="Arpit Labs Logo" 
      width={size} 
      height={size} 
      className={className}
      priority
    />
  );
}
