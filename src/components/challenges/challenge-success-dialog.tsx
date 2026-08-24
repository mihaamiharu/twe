import { useTranslation } from 'react-i18next';
import { useParams, Link } from '@tanstack/react-router';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Star, ArrowRight, RotateCw, Swords } from 'lucide-react';
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
  isBoss?: boolean;
}

export function ChallengeSuccessDialog({
  open,
  onClose,
  xpEarned,
  achievements = [],
  levelUp,
  onNextChallenge,
  onRetry,
  isBoss = false,
}: ChallengeSuccessDialogProps) {
  const { t } = useTranslation(['challenges', 'common']);
  const params = useParams({ strict: false });
  const locale = params.locale || 'en';
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="workspace-shell sm:max-w-md border border-workspace-border bg-workspace-panel text-workspace-text">
        <DialogHeader>
          <div
            className={`mx-auto mb-4 w-fit rounded-md border p-3 ${isBoss ? 'border-brand-error/30 bg-brand-error/10' : 'border-brand-success/30 bg-brand-success/10'}`}
          >
            {isBoss ? (
              <Swords className="h-8 w-8 text-brand-error" />
            ) : (
              <Trophy className="h-8 w-8 text-brand-success" />
            )}
          </div>
          <DialogTitle className="text-center text-xl font-semibold">
            ✓ {t('challenges:success.title')}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-center text-muted-foreground">
          {t('challenges:success.description')}
        </DialogDescription>

        <div className="space-y-5 py-4">
          {/* XP Reward */}
          <div className="flex flex-col items-center rounded-md border border-workspace-border bg-workspace-elevated p-4">
            <span className="font-mono text-xl font-medium text-brand-orange">
              +{xpEarned} {t('common:labels.xp')}
            </span>
            <span className="mt-1 text-sm text-workspace-muted">
              {t('challenges:success.earnedXP')}
            </span>
          </div>

          {/* Level Up Alert */}
          {levelUp && (
            <div className="rounded-md border border-brand-warning/30 bg-brand-warning/10 p-4">
              <div className="flex items-center gap-3 justify-center">
                <Star className="h-5 w-5 text-brand-warning" />
                <div className="text-left">
                  <h4 className="font-bold text-lg">
                    {t('challenges:success.levelUp')}
                  </h4>
                  <p className="text-sm">
                    {t('challenges:success.levelUpDescription', {
                      level: levelUp.newLevel,
                      title: t(`common:levelTitles.${levelUp.title}`),
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Achievements Unlocked */}
          {achievements.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">
                {t('challenges:success.achievementsUnlocked')}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {achievements.map((achievement, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="flex items-center gap-1 border-workspace-border bg-workspace-elevated px-3 py-1 text-workspace-text"
                  >
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
