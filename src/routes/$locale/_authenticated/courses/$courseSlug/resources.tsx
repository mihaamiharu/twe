import { createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, FileText } from 'lucide-react';
import { z } from 'zod';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG } from '@/lib/course-content.types';
import { getCourseOverviewHref } from '@/lib/course-navigation';
import { getCourseResource } from '@/server/course-resources.server';
import { createSeoHead } from '@/lib/seo';
import { isSupportedCourseOverviewParams } from '../$courseSlug';

const CourseResourceSearchSchema = z.object({
  path: z.string().min(1).optional(),
});

export const COURSE_RESOURCE_ROUTE =
  '/$locale/_authenticated/courses/$courseSlug/resources' as const;

export const Route = createFileRoute(
  '/$locale/_authenticated/courses/$courseSlug/resources',
)({
  validateSearch: CourseResourceSearchSchema,
  loaderDeps: ({ search }) => ({ resourcePath: search.path }),
  loader: ({ params, deps }) => {
    if (!isSupportedCourseOverviewParams(params.locale, params.courseSlug)) {
      return {
        success: false as const,
        error: 'Course resource is only available in Indonesian',
      };
    }

    if (!deps.resourcePath) {
      return {
        success: false as const,
        error: 'Resource path is missing',
      };
    }

    return getCourseResource({
      data: {
        courseSlug: AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
        locale: 'id',
        resourcePath: deps.resourcePath,
      },
    });
  },
  component: CourseResourceRoute,
  head: ({ params }) =>
    createSeoHead({
      title: `Course resource | ${params.courseSlug} | TestingWithEkki`,
      description: 'Companion repository Markdown resource for the QA course.',
      path: `/courses/${params.courseSlug}/resources`,
      locale: params.locale,
      noIndex: true,
    }),
});

function CourseResourceRoute() {
  const data = Route.useLoaderData();
  const { courseSlug } = Route.useParams();
  const overviewHref = getCourseOverviewHref('id', courseSlug);

  if (!data.success || !data.data) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-bold">Resource tidak tersedia</h1>
          <p className="text-muted-foreground">{data.error}</p>
          <Button asChild variant="outline">
            <a href={overviewHref}>
              <ArrowLeft className="h-4 w-4" />
              Kembali ke overview course
            </a>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <a href={overviewHref}>
            <ArrowLeft className="h-4 w-4" />
            Kembali ke overview course
          </a>
        </Button>

        <Card>
          <CardContent className="space-y-4 p-6 md:p-8">
            <Badge variant="outline" className="gap-2">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Companion repository
            </Badge>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">
                <code className="break-all text-primary">{data.data.path}</code>
              </h1>
              <p className="mt-2 text-muted-foreground">
                Reference file untuk latihan lokal. Salin hasil kerjamu ke
                repository learner milikmu sendiri.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 md:p-8">
            <MarkdownRenderer content={data.data.content} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
