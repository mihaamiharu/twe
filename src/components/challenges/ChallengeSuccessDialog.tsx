import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from '@tanstack/react-router';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Star, ArrowRight, RotateCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { localeParams, LocaleRoutes } from '@/lib/navigation';

export interface Achievement {
    id: string;
    name: string;
    icon: string;
}

export interface ChallengeSuccessDialogProps {
    open: boolean;
    onClose: () => void;
    xpEarned: number;
    achievements?: Achievement[];
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
    const { t } = useTranslation(['challenges', 'common']);
    const params = useParams({ strict: false }) as { locale?: string };
    const locale = params.locale || 'en';
    useEffect(() => {
        if (open && levelUp) {
            const audio = new Audio('/ragnarok_level_up.mp3');
            audio.volume = 0.4; // Slightly lower volume so it's not too loud
            audio.play().catch(err => {
                console.warn('Failed to play level up sound:', err);
            });
        }
    }, [open, levelUp]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md text-center">
                <DialogHeader>
                    <div className="mx-auto bg-yellow-500/20 p-4 rounded-full w-fit mb-4">
                        <Trophy className="h-10 w-10 text-yellow-500" />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-center">{t('challenges:success.title')}</DialogTitle>
                </DialogHeader>
                <DialogDescription className="text-center text-muted-foreground">
                    {t('challenges:success.description')}
                </DialogDescription>

                <div className="space-y-6 py-4">
                    {/* XP Reward */}
                    <div className="flex flex-col items-center">
                        <span className="text-4xl font-black text-primary animate-in zoom-in spin-in duration-500">
                            +{xpEarned} {t('common:labels.xp')}
                        </span>
                        <span className="text-sm text-muted-foreground mt-1">{t('challenges:success.earnedXP')}</span>
                    </div>

                    {/* Level Up Alert */}
                    {levelUp && (
                        <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 p-4 rounded-lg border border-primary/20 animate-in slide-in-from-bottom duration-700 delay-200">
                            <div className="flex items-center gap-3 justify-center">
                                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                                <div className="text-left">
                                    <h4 className="font-bold text-lg">{t('challenges:success.levelUp')}</h4>
                                    <p className="text-sm">{t('challenges:success.levelUpDescription', { level: levelUp.newLevel, title: levelUp.title })}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Achievements Unlocked */}
                    {achievements.length > 0 && (
                        <div className="space-y-2 animate-in slide-in-from-bottom duration-700 delay-300">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">{t('challenges:success.achievementsUnlocked')}</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {achievements.map((achievement, i) => (
                                    <Badge key={i} variant="outline" className="px-3 py-1 flex gap-1 items-center bg-primary/5 border-primary/20 text-primary shadow-sm">
                                        <span className="text-base">{achievement.icon}</span>
                                        <span className="font-semibold">{achievement.name}</span>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex flex-col gap-3 sm:flex-col sm:gap-3">
                    {onNextChallenge && (
                        <Button onClick={onNextChallenge} className="w-full">
                            {t('challenges:success.nextChallenge')}
                            <ArrowRight className="w-4 h-4 ml-2 animate-bounce-x" />
                        </Button>
                    )}

                    <div className="flex flex-row gap-3 w-full">
                        <Button variant="outline" onClick={onRetry} className="flex-1">
                            <RotateCw className="w-4 h-4 mr-2" />
                            {t('challenges:success.retry')}
                        </Button>
                        <Button variant="secondary" asChild className="flex-1">
                            <Link to={LocaleRoutes.challenges} params={localeParams(locale)}>
                                {t('challenges:success.browseList')}
                            </Link>
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
