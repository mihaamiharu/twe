import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TierProgress {
  tier: string;
  completed: number;
  total: number;
  color: string;
  name: string;
}

interface ChallengeTierProgressProps {
  progress: TierProgress[];
  selectedTier: string;
  onSelectTier: (tier: string) => void;
}

export function ChallengeTierProgress({
  progress,
  selectedTier,
  onSelectTier,
}: ChallengeTierProgressProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {progress.map((item) => {
        const percent =
          item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
        const isSelected = selectedTier === item.tier;

        return (
          <motion.div
            key={item.tier}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectTier(isSelected ? 'all' : item.tier)}
            className={cn(
              'p-4 rounded-xl border flex flex-col gap-3 cursor-pointer transition-all duration-200',
              isSelected
                ? 'bg-primary/5 border-primary ring-1 ring-primary'
                : 'bg-card border-border hover:border-primary/50',
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn('text-sm font-bold', item.color)}>
                {item.name}
              </span>
              <Badge
                variant="secondary"
                className="text-[10px] font-mono bg-background/50"
              >
                {item.completed}/{item.total}
              </Badge>
            </div>
            <div className="space-y-1">
              <Progress value={percent} className="h-1.5" />
              <div className="flex justify-end">
                <span className="text-[10px] text-muted-foreground">
                  {percent}%
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
