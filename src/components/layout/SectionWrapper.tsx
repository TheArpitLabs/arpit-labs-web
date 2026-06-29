import { cn } from "@/lib/utils/utils";
import { Badge } from "@/components/ui/badge";

interface SectionWrapperProps {
  title: string;
  subtitle: string;
  badge?: string;
  className?: string;
  children: React.ReactNode;
}

export function SectionWrapper({ title, subtitle, badge, className, children }: SectionWrapperProps) {
  return (
    <section className={cn("py-16 md:py-20", className)}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:items-start sm:flex-row sm:justify-between sm:gap-6">
          <div className="space-y-3">
            {badge ? <Badge variant="secondary">{badge}</Badge> : null}
            <h2 className="text-section-title font-semibold leading-tight tracking-tight text-foreground">
              {title}
            </h2>
            <p className="max-w-3xl text-body text-muted">{subtitle}</p>
          </div>
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
