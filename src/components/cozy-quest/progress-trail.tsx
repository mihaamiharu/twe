import { Check, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface ProgressTrailItem {
  id: string;
  title: string;
  description: string;
  skills: string[];
  count: number;
}

interface ProgressTrailProps {
  items: ProgressTrailItem[];
  stageLabel: string;
  countLabel: string;
  comingSoonLabel: string;
}

export function ProgressTrail({
  items,
  stageLabel,
  countLabel,
  comingSoonLabel,
}: ProgressTrailProps) {
  return (
    <ol className="relative grid gap-5 lg:grid-cols-4 lg:gap-4">
      <div
        aria-hidden="true"
        className="absolute left-6 top-7 h-[calc(100%-3.5rem)] w-px border-l-2 border-dashed border-primary/25 lg:left-[12.5%] lg:right-[12.5%] lg:top-7 lg:h-px lg:w-auto lg:border-l-0 lg:border-t-2"
      />
      {items.map((item, index) => {
        const available = item.count > 0;
        return (
          <li key={item.id} className="relative pl-16 lg:pl-0 lg:pt-14">
            <div className="absolute left-0 top-0 z-10 flex size-12 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-sm lg:left-1/2 lg:-translate-x-1/2">
              {available ? (
                <Check className="size-5" />
              ) : (
                <MapPin className="size-5" />
              )}
              <span className="sr-only">
                {stageLabel} {index + 1}
              </span>
            </div>
            <div className="paper-surface h-full rounded-2xl border border-border bg-card p-5 shadow-[0_12px_30px_rgba(73,62,45,0.07)]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                {stageLabel} {index + 1}
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {item.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="font-medium"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
              <p className="mt-4 text-sm font-bold text-primary">
                {available ? `${item.count} ${countLabel}` : comingSoonLabel}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
