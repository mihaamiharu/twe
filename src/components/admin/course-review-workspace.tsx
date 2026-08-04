import { useMemo, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ClipboardCheck, FileText, LockKeyhole, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  createAdminCourseReview,
  finalizeAdminCourseReview,
  generateAdminCourseReviewDraft,
  getAdminCourseReviews,
  updateAdminCourseReviewDraft,
} from '@/server/admin/course-reviews.fn';
import type {
  CourseReviewCheckpointStatus,
  CourseReviewFile,
} from '@/lib/course-review';

const COURSE_SLUG = 'ai-assisted-qa-workflow' as const;
const CHECKPOINTS = [
  ['01-requirements', 'Requirements analysis'],
  ['02-test-design', 'AI-assisted test design'],
  ['03-test-writing', 'Test writing'],
  ['04-automation', 'Playwright automation'],
  ['05-execution', 'Test execution and evidence'],
  ['06-triage', 'Failure triage'],
  ['07-quality-summary', 'Quality decision and capstone'],
] as const;

type ReviewListItem = Awaited<
  ReturnType<typeof getAdminCourseReviews>
>['data'][number];

export function CourseReviewWorkspace() {
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [reviewRound, setReviewRound] = useState('1');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [checkpointSlug, setCheckpointSlug] = useState<string>(
    CHECKPOINTS[0][0],
  );
  const [files, setFiles] = useState<CourseReviewFile[]>([]);
  const [finalFeedback, setFinalFeedback] = useState('');

  const reviewsQuery = useQuery({
    queryKey: ['admin-course-reviews'],
    queryFn: async () => {
      const result = await getAdminCourseReviews();
      if (!result.success) throw new Error('Unable to load course reviews');
      return result.data;
    },
  });

  const selectedReview = useMemo(
    () =>
      reviewsQuery.data?.find((review) => review.id === selectedReviewId) ??
      null,
    [reviewsQuery.data, selectedReviewId],
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      const result = await createAdminCourseReview({
        data: {
          courseSlug: COURSE_SLUG,
          repositoryUrl,
          reviewRound: Number(reviewRound),
          reviewerNotes: reviewerNotes || undefined,
        },
      });
      if (!result.success) throw new Error('Unable to create course review');
      return result.data;
    },
    onSuccess: async (review) => {
      setSelectedReviewId(review.id);
      await reviewsQuery.refetch();
      toast.success('Review workspace created');
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedReviewId) throw new Error('Select a review first');
      const result = await generateAdminCourseReviewDraft({
        data: {
          reviewId: selectedReviewId,
          courseSlug: COURSE_SLUG,
          locale: 'id',
          checkpointSlug,
          files,
          reviewerNotes: reviewerNotes || undefined,
        },
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      setFiles([]);
      await reviewsQuery.refetch();
      toast.success('AI draft generated for your review');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: {
      checkpointSlug: string;
      status: CourseReviewCheckpointStatus;
    }) => {
      if (!selectedReviewId) throw new Error('Select a review first');
      const result = await updateAdminCourseReviewDraft({
        data: {
          reviewId: selectedReviewId,
          ...input,
          reviewerNotes: reviewerNotes || undefined,
        },
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      await reviewsQuery.refetch();
      toast.success('Review status updated');
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedReviewId) throw new Error('Select a review first');
      const result = await finalizeAdminCourseReview({
        data: { reviewId: selectedReviewId, finalFeedback },
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      await reviewsQuery.refetch();
      toast.success('Review finalized. Send the feedback manually.');
    },
  });

  async function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []).slice(0, 8);
    const nextFiles = await Promise.all(
      selectedFiles.map(async (file) => ({
        path: file.name,
        content: await file.text(),
      })),
    );
    setFiles(nextFiles);
    event.target.value = '';
  }

  function selectReview(review: ReviewListItem) {
    setSelectedReviewId(review.id);
    setRepositoryUrl(review.repositoryUrl);
    setReviewRound(String(review.reviewRound));
    setReviewerNotes(review.reviewerNotes ?? '');
    setFinalFeedback(review.finalFeedback ?? '');
  }

  const currentDraft = Object.entries(
    selectedReview?.checkpointDrafts ?? {},
  ).find(([slug]) => slug === checkpointSlug)?.[1];
  const generatedCount = selectedReview
    ? Object.keys(selectedReview.checkpointDrafts).length
    : 0;

  return (
    <div className="container mx-auto space-y-8 p-6 text-card-foreground">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <ClipboardCheck className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Private reviewer workspace
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            AI course review
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Generate a structured draft, verify it yourself, and send final
            feedback manually. Learners never see the AI draft.
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-2">
          <LockKeyhole className="h-3.5 w-3.5" /> Admin only
        </Badge>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Start a review</CardTitle>
            <CardDescription>
              Store only the repository URL and structured drafts. Raw files are
              processed for generation and then cleared.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={repositoryUrl}
              onChange={(event) => setRepositoryUrl(event.target.value)}
              placeholder="https://github.com/learner/repository"
              aria-label="Learner repository URL"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium">Review round</span>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={reviewRound}
                  onChange={(event) => setReviewRound(event.target.value)}
                >
                  <option value="1">Initial review</option>
                  <option value="2">Follow-up review</option>
                </select>
              </label>
              <div className="flex items-end">
                <Button
                  className="w-full"
                  disabled={!repositoryUrl || createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                >
                  Create review workspace
                </Button>
              </div>
            </div>
            <Textarea
              value={reviewerNotes}
              onChange={(event) => setReviewerNotes(event.target.value)}
              placeholder="Private reviewer context (optional)"
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing reviews</CardTitle>
            <CardDescription>
              Select a review to continue editing or finalize feedback.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviewsQuery.isLoading && (
              <p className="text-sm text-muted-foreground">Loading reviews…</p>
            )}
            {!reviewsQuery.isLoading && !reviewsQuery.data?.length && (
              <p className="text-sm text-muted-foreground">
                No review workspaces yet.
              </p>
            )}
            {reviewsQuery.data?.map((review) => (
              <button
                key={review.id}
                type="button"
                onClick={() => selectReview(review)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedReviewId === review.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium">
                    {review.repositoryUrl}
                  </span>
                  <Badge
                    variant={
                      review.status === 'FINALIZED' ? 'default' : 'secondary'
                    }
                  >
                    {review.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Round {review.reviewRound} ·{' '}
                  {Object.keys(review.checkpointDrafts).length}/7 checkpoints
                  drafted
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
      </section>

      {selectedReview && (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Generate checkpoint draft</CardTitle>
              <CardDescription>
                Select only the files relevant to this checkpoint. They are not
                stored after processing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="space-y-1 text-sm">
                <span className="font-medium">Checkpoint</span>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={checkpointSlug}
                  onChange={(event) => setCheckpointSlug(event.target.value)}
                >
                  {CHECKPOINTS.map(([slug, label]) => (
                    <option key={slug} value={slug}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2 text-sm">
                <span className="font-medium">Relevant text files</span>
                <Input
                  type="file"
                  multiple
                  accept=".md,.txt,.ts,.tsx,.js,.json,.yml,.yaml,.log"
                  onChange={(event) => {
                    void handleFilesChange(event);
                  }}
                />
              </label>
              {files.length > 0 && (
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {files.map((file) => (
                    <li key={file.path} className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {file.path}
                    </li>
                  ))}
                </ul>
              )}
              <Button
                className="w-full gap-2"
                disabled={
                  !files.length ||
                  generateMutation.isPending ||
                  selectedReview.status === 'FINALIZED'
                }
                onClick={() => generateMutation.mutate()}
              >
                <Sparkles className="h-4 w-4" />
                Generate AI draft
              </Button>
              <p className="text-xs leading-5 text-muted-foreground">
                Never select credentials, personal data, private URLs, or full
                repositories. The owner makes the final decision.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Structured review draft</CardTitle>
                  <CardDescription>
                    {generatedCount}/7 checkpoint drafts generated.
                  </CardDescription>
                </div>
                {currentDraft && (
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={currentDraft.status}
                    disabled={
                      selectedReview.status === 'FINALIZED' ||
                      updateMutation.isPending
                    }
                    onChange={(event) =>
                      updateMutation.mutate({
                        checkpointSlug,
                        status: event.target
                          .value as CourseReviewCheckpointStatus,
                      })
                    }
                  >
                    <option value="MEETS_EXPECTATIONS">
                      Meets expectations
                    </option>
                    <option value="NEEDS_REVISION">Needs revision</option>
                  </select>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {!currentDraft && (
                <p className="text-sm text-muted-foreground">
                  Generate a draft for the selected checkpoint to review it
                  here.
                </p>
              )}
              {currentDraft && (
                <>
                  <ReviewList
                    title="Evidence"
                    items={currentDraft.evidence.map(
                      (item) =>
                        `${item.path}${item.location ? ` (${item.location})` : ''}: ${item.observation}`,
                    )}
                  />
                  <ReviewList title="Concerns" items={currentDraft.concerns} />
                  <ReviewList
                    title="Suggested improvements"
                    items={currentDraft.suggestions}
                  />
                  <ReviewList
                    title="Uncertainty"
                    items={currentDraft.uncertainty}
                  />
                  <ReviewList
                    title="Human verification"
                    items={currentDraft.humanVerification}
                  />
                  <p className="text-xs text-muted-foreground">
                    AI confidence: {currentDraft.confidence}. Verify every claim
                    against the learner repository before sending feedback.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {selectedReview && (
        <Card>
          <CardHeader>
            <CardTitle>Final private feedback</CardTitle>
            <CardDescription>
              Edit the AI-assisted findings into your own message. Send it
              manually after finalizing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={finalFeedback}
              onChange={(event) => setFinalFeedback(event.target.value)}
              placeholder="Write the final private feedback for the learner…"
              rows={10}
              disabled={selectedReview.status === 'FINALIZED'}
            />
            <Button
              disabled={
                !finalFeedback.trim() ||
                finalizeMutation.isPending ||
                selectedReview.status === 'FINALIZED'
              }
              onClick={() => finalizeMutation.mutate()}
            >
              Finalize review for manual sending
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReviewList({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {items.length ? (
        <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">None reported.</p>
      )}
    </section>
  );
}
