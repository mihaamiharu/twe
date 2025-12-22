import { AlertCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@tanstack/react-router';

interface TierSkipTipProps {
    currentTier: string;
    missingPrerequisites: {
        tier: string;
        name: string;
    }[];
}

export function TierSkipTip({ currentTier, missingPrerequisites }: TierSkipTipProps) {
    if (missingPrerequisites.length === 0) return null;

    const mainMissing = missingPrerequisites[0];

    return (
        <Card className="mb-6 border-amber-500/50 bg-amber-500/5 text-amber-600 dark:text-amber-400">
            <CardHeader className="p-4 pb-0">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Expert Tip: Check the Fundamentals
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 text-sm">
                This {currentTier} challenge uses concepts covered in the <span className="font-semibold">{mainMissing.name}</span> tier.
                If you get stuck, we recommend trying those first to build a solid foundation!
                <div className="mt-2 text-xs">
                    <Link to="/challenges" search={{ tier: mainMissing.tier }} className="inline-flex items-center gap-1 font-semibold underline hover:text-amber-500 font-mono">
                        View {mainMissing.name} Challenges <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
