import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Laptop,
  Lightbulb,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CourseLearnerShell } from '@/components/courses/course-learner-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type {
  CourseContentDocument,
  CourseManifest,
} from '@/lib/course-content.types';
import {
  getCourseCheckpointHref,
  getCourseOverviewHref,
} from '@/lib/course-navigation';

export interface CourseStartHereData {
  manifest: CourseManifest;
  content: CourseContentDocument;
  completedCheckpointSlugs?: readonly string[];
  capstoneCompleted?: boolean;
}

interface CourseStartHerePageProps {
  course: CourseStartHereData;
  locale: 'id';
}

function CourseStartHerePage({ course, locale }: CourseStartHerePageProps) {
  const { t } = useTranslation('courses');
  const { content, manifest } = course;
  const startHere = content.startHere;
  const overviewHref = getCourseOverviewHref(locale, manifest.slug);
  const firstCheckpoint = [...manifest.checkpoints].sort(
    (a, b) => a.order - b.order,
  )[0];
  const firstCheckpointContent = firstCheckpoint
    ? content.checkpoints.find(
        (checkpoint) => checkpoint.slug === firstCheckpoint.slug,
      )
    : undefined;
  const firstCheckpointHref = firstCheckpoint
    ? getCourseCheckpointHref(locale, manifest.slug, firstCheckpoint.slug)
    : undefined;

  return (
    <CourseLearnerShell
      manifest={manifest}
      content={content}
      locale={locale}
      completedCheckpointSlugs={course.completedCheckpointSlugs}
      capstoneCompleted={course.capstoneCompleted}
      dataTestId="course-start-here"
    >
      <div className="space-y-8">
        <header className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 hard-shadow md:p-10">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative max-w-4xl space-y-5">
            <Button asChild variant="ghost" size="sm" className="-ml-3">
              <a href={overviewHref}>
                <ArrowLeft className="h-4 w-4" />
                {t('startHere.backToCourse')}
              </a>
            </Button>
            <Badge variant="outline" className="gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              {t('startHere.badge')}
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                {startHere.title}
              </h1>
              <p className="text-lg leading-8 text-muted-foreground md:text-xl">
                {startHere.subtitle}
              </p>
              <p className="max-w-3xl leading-7 text-muted-foreground">
                {startHere.introduction}
              </p>
            </div>
          </div>
        </header>

        <section className="space-y-5" data-testid="course-start-here-workflow">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
              {t('startHere.instructions')}
            </p>
            <h2 className="text-2xl font-bold md:text-3xl">
              {t('startHere.workflow')}
            </h2>
          </div>

          <ol className="grid gap-5">
            {startHere.steps.map((step, index) => (
              <li key={step.id}>
                <Card data-testid={`course-start-here-step-${step.id}`}>
                  <CardContent className="grid gap-6 p-5 md:grid-cols-[auto_1fr] md:p-6">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-lg font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="min-w-0 space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold">{step.title}</h3>
                        <p className="leading-7 text-muted-foreground">
                          {step.purpose}
                        </p>
                      </div>

                      <div>
                        <h4 className="mb-2 font-semibold">
                          {t('startHere.instructions')}
                        </h4>
                        <ol className="space-y-2 text-sm leading-6 text-muted-foreground">
                          {step.instructions.map((instruction) => (
                            <li key={instruction} className="flex gap-2">
                              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                              <span>{instruction}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {step.commands.length > 0 && (
                        <div>
                          <h4 className="mb-2 flex items-center gap-2 font-semibold">
                            <Terminal className="h-4 w-4 text-primary" />
                            {t('startHere.commands')}
                          </h4>
                          <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-4 text-sm leading-6 text-foreground">
                            <code>{step.commands.join('\n')}</code>
                          </pre>
                        </div>
                      )}

                      {step.notes.length > 0 && (
                        <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-4">
                          <h4 className="mb-2 flex items-center gap-2 font-semibold">
                            <Lightbulb className="h-4 w-4 text-primary" />
                            {t('startHere.notes')}
                          </h4>
                          <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                            {step.notes.map((note) => (
                              <li key={note} className="flex gap-2">
                                <span aria-hidden="true">•</span>
                                <span>{note}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <Card
          className="border-primary/30 bg-primary/[0.04]"
          data-testid="course-start-here-expected-output"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {startHere.expectedOutput.title}
            </CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7">
              {startHere.expectedOutput.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg border border-border bg-background p-4 text-sm leading-6 text-foreground">
              <code>{startHere.expectedOutput.lines.join('\n')}</code>
            </pre>
          </CardContent>
        </Card>

        <section
          className="space-y-5"
          data-testid="course-start-here-platforms"
        >
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
              {t('startHere.notes')}
            </p>
            <h2 className="text-2xl font-bold md:text-3xl">
              {t('startHere.platformNotes')}
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {startHere.platformNotes.map((platform) => (
              <Card
                key={platform.id}
                data-testid={`course-start-here-platform-${platform.id}`}
              >
                <CardHeader>
                  <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Laptop className="h-5 w-5" />
                  </div>
                  <CardTitle>{platform.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                    {platform.notes.map((note) => (
                      <li key={note} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section
          className="space-y-5"
          data-testid="course-start-here-troubleshooting"
        >
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
              {t('startHere.notes')}
            </p>
            <h2 className="text-2xl font-bold md:text-3xl">
              {t('startHere.troubleshooting')}
            </h2>
          </div>
          <div className="grid gap-4">
            {startHere.troubleshooting.map((item) => (
              <Card key={item.problem}>
                <CardContent className="grid gap-3 p-5 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:p-6">
                  <h3 className="flex items-start gap-2 font-semibold">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    {item.problem}
                  </h3>
                  <p className="leading-7 text-muted-foreground">
                    {item.solution}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card
          className="border-destructive/30 bg-destructive/[0.04]"
          data-testid="course-start-here-safety"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {t('startHere.safety')}
            </CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7">
              {t('startHere.safetyDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 md:grid-cols-2">
              {startHere.safetyRules.map((rule) => (
                <li
                  key={rule}
                  className="flex items-start gap-2 text-sm leading-6"
                >
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {firstCheckpoint && firstCheckpointContent && firstCheckpointHref && (
          <Card
            className="border-primary/30 bg-primary/[0.04]"
            data-testid="course-start-here-next"
          >
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                  {t('startHere.nextStep')}
                </p>
                <h2 className="text-xl font-semibold">
                  {firstCheckpointContent.title}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {firstCheckpointContent.objective}
                </p>
              </div>
              <Button asChild size="lg">
                <a
                  href={firstCheckpointHref}
                  data-testid="course-start-here-next-link"
                >
                  {t('startHere.openFirstCheckpoint')}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap justify-between gap-3">
          <Button asChild variant="outline">
            <a
              href={overviewHref}
              data-testid="course-start-here-overview-link"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('startHere.backToCourse')}
            </a>
          </Button>
        </div>
      </div>
    </CourseLearnerShell>
  );
}

export { CourseStartHerePage };
