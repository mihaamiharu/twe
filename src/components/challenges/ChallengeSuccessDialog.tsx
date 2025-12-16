import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Star, ArrowRight, RotateCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from '@tanstack/react-router';

export interface ChallengeSuccessDialogProps {
    open: boolean;
    onClose: () => void;
    xpEarned: number;
    achievements?: string[];
    levelUp?: {
        newLevel: number;
        title: string;
    };
    onNextChallenge?: () => void;
    onRetry?: () => void;
}

export function ChallengeSuccessDialog({
    open,
    onClose,
    xpEarned,
    achievements = [],
    levelUp,
    onNextChallenge,
    onRetry,
}: ChallengeSuccessDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md text-center">
                <DialogHeader>
                    <div className="mx-auto bg-yellow-500/20 p-4 rounded-full w-fit mb-4">
                        <Trophy className="h-10 w-10 text-yellow-500" />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-center">Challenge Complete!</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* XP Reward */}
                    <div className="flex flex-col items-center">
                        <span className="text-4xl font-black text-primary animate-in zoom-in spin-in duration-500">
                            +{xpEarned} XP
                        </span>
                        <span className="text-sm text-muted-foreground mt-1">Earned for completion</span>
                    </div>

                    {/* Level Up Alert */}
                    {levelUp && (
                        <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 p-4 rounded-lg border border-primary/20 animate-in slide-in-from-bottom duration-700 delay-200">
                            <div className="flex items-center gap-3 justify-center">
                                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                                <div className="text-left">
                                    <h4 className="font-bold text-lg">Level Up!</h4>
                                    <p className="text-sm">You are now level {levelUp.newLevel}: <span className="text-primary font-medium">{levelUp.title}</span></p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Achievements Unlocked */}
                    {achievements.length > 0 && (
                        <div className="space-y-2 animate-in slide-in-from-bottom duration-700 delay-300">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">Achievements Unlocked</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {achievements.map((achievement, i) => (
                                    <Badge key={i} variant="secondary" className="px-3 py-1 flex gap-1 items-center bg-accent/10 border-accent/20 text-accent-foreground">
                                        <Trophy className="h-3 w-3" />
                                        {achievement}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onRetry} className="w-full sm:w-auto">
                        <RotateCw className="w-4 h-4 mr-2" />
                        Practice Again
                    </Button>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="secondary" asChild className="flex-1 sm:flex-none">
                            <Link to="/challenges">
                                Browse Challenges
                            </Link>
                        </Button>
                        {onNextChallenge && (
                            <Button onClick={onNextChallenge} className="flex-1 sm:flex-none">
                                Next Challenge
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
