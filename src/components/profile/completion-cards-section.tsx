import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  RefreshCw,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { EmptyState } from '@/components/empty-state';
import {
  getEligibleCompletionCards,
  getSafeLearnerDisplayName,
  normalizeCompletionLocale,
  type EligibleCompletionCard,
} from '@/lib/completion-card';
import type { TutorialListCatalogResponse } from '@/lib/catalog.types';
import { localeParams, LocaleRoutes } from '@/lib/navigation';
import {
  createCompletionCardShare,
  type CompletionCardShareData,
} from '@/server/completion-cards.fn';

interface CompletionCardsSectionProps {
  locale: string;
  userName: string | null;
  tutorialMeta: TutorialListCatalogResponse['meta'] | undefined;
  isLoading: boolean;
}

export function CompletionCardsSection({
  locale,
  userName,
  tutorialMeta,
  isLoading,
}: CompletionCardsSectionProps) {
  const { t } = useTranslation(['profile', 'common']);
  const normalizedLocale = normalizeCompletionLocale(locale) ?? 'en';
  const safeDisplayName = useMemo(
    () => getSafeLearnerDisplayName(userName),
    [userName],
  );

  const eligibleCards = useMemo(() => {
    if (!tutorialMeta) return [];
    return getEligibleCompletionCards(tutorialMeta, normalizedLocale);
  }, [tutorialMeta, normalizedLocale]);

  const completedModulesCount = useMemo(() => {
    if (!tutorialMeta) return 0;
    return eligibleCards.filter((card) => card.kind === 'module').length;
  }, [eligibleCards, tutorialMeta]);

  const totalModulesCount = tutorialMeta?.modules.length ?? 0;

  const [selectedCard, setSelectedCard] =
    useState<EligibleCompletionCard | null>(null);
  const [includeName, setIncludeName] = useState(false);
  const shareCacheRef = useRef<Map<string, CompletionCardShareData>>(new Map());
  const requestIdRef = useRef(0);
  const [activeShare, setActiveShare] =
    useState<CompletionCardShareData | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadShareCard = useCallback(
    async (card: EligibleCompletionCard, withName: boolean, force = false) => {
      const key = `${card.kind}:${card.slug}:${normalizedLocale}:${withName ? 'named' : 'anon'}`;
      const requestId = ++requestIdRef.current;
      setShareError(null);
      setImageFailed(false);
      setCopied(false);

      const cached = force ? undefined : shareCacheRef.current.get(key);
      if (cached) {
        setActiveShare((previous) => {
          if (previous?.imagePath !== cached.imagePath) {
            setImageLoaded(false);
          }
          return cached;
        });
        setIsGenerating(false);
        return;
      }

      setActiveShare(null);
      setIsGenerating(true);
      setImageLoaded(false);
      try {
        const result = await createCompletionCardShare({
          data: {
            kind: card.kind,
            slug: card.slug,
            locale: normalizedLocale,
            includeName: withName,
          },
        });
        if (requestId !== requestIdRef.current) return;
        if (!result.success) {
          setShareError(result.error);
          return;
        }
        shareCacheRef.current.set(key, result.data);
        setActiveShare(result.data);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setShareError(t('profile:completionCards.dialog.errorPreview'));
      } finally {
        if (requestId === requestIdRef.current) {
          setIsGenerating(false);
        }
      }
    },
    [normalizedLocale, t],
  );

  useEffect(() => {
    if (!selectedCard) return;
    void loadShareCard(selectedCard, includeName);
  }, [selectedCard, includeName, loadShareCard]);

  const handleOpenCard = (card: EligibleCompletionCard) => {
    setIncludeName(false);
    setShareError(null);
    setImageFailed(false);
    setCopied(false);
    setSelectedCard(card);
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      requestIdRef.current += 1;
      setSelectedCard(null);
      setActiveShare(null);
      setShareError(null);
      setCopied(false);
    }
  };

  const handleCopyLink = async () => {
    if (!activeShare || typeof window === 'undefined') return;
    const absoluteUrl = `${window.location.origin}${activeShare.imagePath}`;
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const learnPageUrl = `https://testingwithekki.com/${normalizedLocale}/learn`;
  const linkedInShareUrl = activeShare
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(learnPageUrl)}`
    : null;
  const xShareUrl = activeShare
    ? `https://x.com/intent/tweet?text=${encodeURIComponent(activeShare.shareText)}&url=${encodeURIComponent(learnPageUrl)}`
    : null;

  return (
    <Card className="rounded-xl border-[var(--soft-border)] bg-[var(--paper-surface)] shadow-none">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
            {t('profile:completionCards.eyebrow')}
          </p>
          <CardTitle className="mt-1.5 text-xl">
            {t('profile:completionCards.title')}
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl">
            {t('profile:completionCards.description')}
          </CardDescription>
        </div>
        {totalModulesCount > 0 && (
          <Badge
            variant="outline"
            className="w-fit shrink-0 font-mono text-[11px]"
          >
            {t('profile:completionCards.progressSummary', {
              completed: completedModulesCount,
              total: totalModulesCount,
            })}
          </Badge>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-border bg-background/60 p-4"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-5 w-48" />
                <Skeleton className="mt-4 h-9 w-36" />
              </div>
            ))}
          </div>
        ) : eligibleCards.length === 0 ? (
          <EmptyState
            size="compact"
            eyebrow={t('profile:completionCards.emptyEyebrow')}
            title={t('profile:completionCards.emptyTitle')}
            description={t('profile:completionCards.emptyDescription')}
            action={
              <Button asChild size="sm">
                <Link to={LocaleRoutes.learn} params={localeParams(locale)}>
                  {t('profile:completionCards.emptyCta')}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            }
          />
        ) : (
          <div
            className="grid gap-3 sm:grid-cols-2"
            data-testid="completion-cards-list"
          >
            {eligibleCards.map((card) => {
              const isTrack = card.kind === 'track';
              return (
                <div
                  key={`${card.kind}-${card.slug}`}
                  className={
                    isTrack
                      ? 'flex flex-col justify-between gap-4 rounded-xl border border-[var(--brand-orange)]/45 bg-[var(--orange-tint)]/35 p-4 sm:col-span-2 sm:flex-row sm:items-center'
                      : 'flex flex-col justify-between gap-4 rounded-xl border border-border bg-background/65 p-4 transition-colors hover:border-[var(--brand-orange)]/45'
                  }
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-primary">
                        {isTrack
                          ? t('profile:completionCards.trackBadge')
                          : t('profile:completionCards.moduleBadge', {
                              number: String(card.order).padStart(2, '0'),
                            })}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-success)]/12 px-2 py-0.5 text-[11px] font-medium text-[var(--brand-success)]">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        {t('profile:completionCards.completedBadge')}
                      </span>
                    </div>

                    <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                      {isTrack && (
                        <Award
                          className="h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                      )}
                      <span className="truncate">{card.title}</span>
                    </h3>

                    <p className="font-mono text-[11px] text-muted-foreground">
                      {card.corePractice > 0
                        ? t('profile:completionCards.statsSummary', {
                            lessons: card.coreLessons,
                            practice: card.corePractice,
                          })
                        : t('profile:completionCards.statsLessonsOnly', {
                            lessons: card.coreLessons,
                          })}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant={isTrack ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleOpenCard(card)}
                    className="w-fit shrink-0"
                    data-testid={`share-card-${card.kind}-${card.slug}`}
                  >
                    <Share2 className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                    {t('profile:completionCards.previewButton')}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={selectedCard !== null} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t('profile:completionCards.dialog.title')}
            </DialogTitle>
            <DialogDescription>
              {t('profile:completionCards.dialog.description')}
            </DialogDescription>
          </DialogHeader>

          {selectedCard && (
            <div className="space-y-4">
              {/* Opt-in display name control */}
              <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-3.5">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="completion-card-include-name"
                    className="text-sm font-medium text-foreground"
                  >
                    {t('profile:completionCards.dialog.includeNameLabel')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {safeDisplayName
                      ? t(
                          'profile:completionCards.dialog.includeNameDescription',
                        )
                      : t(
                          'profile:completionCards.dialog.includeNameUnavailable',
                        )}
                  </p>
                </div>
                <Switch
                  id="completion-card-include-name"
                  checked={includeName}
                  disabled={!safeDisplayName || isGenerating}
                  onCheckedChange={setIncludeName}
                />
              </div>

              {/* 1200x630 PNG preview */}
              <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-xl border border-border bg-[var(--warm-canvas)]">
                {(isGenerating || (!imageLoaded && !shareError && !imageFailed)) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                    <Skeleton className="h-full w-full rounded-none" />
                    <span className="sr-only">
                      {t('profile:completionCards.dialog.loadingPreview')}
                    </span>
                  </div>
                )}

                {shareError || imageFailed ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <p className="max-w-sm text-sm text-muted-foreground">
                      {shareError ||
                        t('profile:completionCards.dialog.errorPreview')}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void loadShareCard(selectedCard, includeName, true)
                      }
                    >
                      <RefreshCw
                        className="mr-2 h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      {t('profile:completionCards.dialog.retry')}
                    </Button>
                  </div>
                ) : (
                  activeShare && (
                    <img
                      key={activeShare.imagePath}
                      src={activeShare.imagePath}
                      alt={t('profile:completionCards.dialog.previewAlt', {
                        title: activeShare.title,
                      })}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => {
                        setImageLoaded(false);
                        setImageFailed(true);
                      }}
                      className="h-full w-full object-cover"
                    />
                  )
                )}
              </div>

              {/* Primary actions: Download PNG & Copy image link */}
              <div className="flex flex-wrap items-center gap-2.5">
                {activeShare ? (
                  <Button asChild size="sm">
                    <a
                      href={`${activeShare.imagePath}&download=1`}
                      download={activeShare.filename}
                    >
                      <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                      {t('profile:completionCards.dialog.downloadPng')}
                    </a>
                  </Button>
                ) : (
                  <Button type="button" size="sm" disabled>
                    <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                    {t('profile:completionCards.dialog.downloadPng')}
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!activeShare}
                  onClick={() => void handleCopyLink()}
                >
                  {copied ? (
                    <Check
                      className="mr-2 h-4 w-4 text-[var(--brand-success)]"
                      aria-hidden="true"
                    />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                  )}
                  {copied
                    ? t('profile:completionCards.dialog.copied')
                    : t('profile:completionCards.dialog.copyLink')}
                </Button>

                {linkedInShareUrl && (
                  <Button asChild variant="ghost" size="sm">
                    <a
                      href={linkedInShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('profile:completionCards.dialog.shareLinkedIn')}
                      <ExternalLink
                        className="ml-1.5 h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </a>
                  </Button>
                )}

                {xShareUrl && (
                  <Button asChild variant="ghost" size="sm">
                    <a
                      href={xShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('profile:completionCards.dialog.shareX')}
                      <ExternalLink
                        className="ml-1.5 h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </a>
                  </Button>
                )}
              </div>

              <div className="space-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                <p>{t('profile:completionCards.dialog.socialTip')}</p>
                <p className="flex items-center gap-1.5">
                  <ShieldCheck
                    className="h-3.5 w-3.5 shrink-0 text-[var(--brand-success)]"
                    aria-hidden="true"
                  />
                  <span>{t('profile:completionCards.dialog.privacyNote')}</span>
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
