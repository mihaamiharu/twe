import { createFileRoute, Link, getRouteApi } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { workshopsListQueryOptions } from '@/lib/workshops.query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Github } from 'lucide-react';
import { createSeoHead } from '@/lib/seo';

export const Route = createFileRoute('/$locale/workshops/')({
  loader: ({ context, params }) => {
    return context.queryClient.ensureQueryData(
      workshopsListQueryOptions(params.locale),
    );
  },
  component: WorkshopsPage,
  head: ({ params }) => {
    return createSeoHead({
      title: 'Workshops',
      description: 'Hands-on guided learning workshops',
      path: '/workshops',
      locale: params.locale || 'en',
    });
  },
});

const routeApi = getRouteApi('/$locale/workshops/');

function WorkshopsPage() {
  const { locale } = routeApi.useParams();
  
  const { data: workshops } = useSuspenseQuery(
    workshopsListQueryOptions(locale),
  );

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold gradient-text mb-3">Workshops</h1>
          <p className="text-muted-foreground text-lg">Hands-on guided video courses with GitHub repositories</p>
        </div>

        {(!workshops || workshops.length === 0) && (
          <div className="text-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Workshops Found</h3>
            <p className="text-muted-foreground">Check back later for new content!</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workshops?.map((workshop) => (
            <Link
              key={workshop.slug}
              to="/$locale/workshops/$workshopSlug"
              params={{ locale, workshopSlug: workshop.slug }}
              className="group"
            >
              <Card className="h-full glass-card hover:border-brand-teal/50 hover:scale-[1.02] transition-all duration-300 relative overflow-hidden flex flex-col mx-auto w-full">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-brand-teal/10 text-brand-teal">
                      <Video className="h-5 w-5" />
                    </div>
                    {workshop.tags?.map(tag => (
                      <Badge key={tag} variant="secondary" className="border-transparent bg-secondary/50">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <CardTitle className="group-hover:text-brand-teal transition-colors text-xl leading-tight">
                    {workshop.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3 mt-2 text-base">
                    {workshop.description}
                  </CardDescription>
                </CardHeader>
                <div className="flex-grow" />
                <CardContent className="mt-auto pt-0">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-border/50 pt-4">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Github className="h-4 w-4 shrink-0" />
                      <span className="font-medium truncate">
                        {workshop.repoUrl.replace('https://github.com/', '')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
