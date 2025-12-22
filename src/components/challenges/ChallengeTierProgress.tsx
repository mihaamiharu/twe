import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface TierProgress {
    tier: string;
    completed: number;
    total: number;
    color: string;
    name: string;
}

interface ChallengeTierProgressProps {
    progress: TierProgress[];
}

export function ChallengeTierProgress({ progress }: ChallengeTierProgressProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {progress.map((item) => {
                const percent = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;

                return (
                    <div key={item.tier} className="p-4 rounded-lg bg-card border border-border flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className={`text-sm font-bold ${item.color}`}>{item.name}</span>
                            <Badge variant="secondary" className="text-[10px] font-mono">
                                {item.completed}/{item.total}
                            </Badge>
                        </div>
                        <div className="space-y-1">
                            <Progress value={percent} className="h-1.5" />
                            <div className="flex justify-end">
                                <span className="text-[10px] text-muted-foreground">{percent}%</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
