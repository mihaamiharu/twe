import { createFileRoute, Link, getRouteApi } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { workshopQueryOptions } from '@/lib/workshops.query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Github, ChevronRight, PlayCircle } from 'lucide-react';
import { createSeoHead } from '@/lib/seo';

export const Route = createFileRoute('/$locale/workshops/$workshopSlug/')({
  loader: ({ context, params }) => {
    return context.queryClient.ensureQueryData(
      workshopQueryOptions(params.workshopSlug, params.locale),
    );
  },
  component: WorkshopDetailPage,
  head: ({ params }) => {
    return createSeoHead({
      title: 'Workshop Detail',
      description: 'Hands-on guided learning workshops',
      path: `/workshops/${params.workshopSlug}`,
      locale: params.locale || 'en',
    });
  },
});

const routeApi = getRouteApi('/$locale/workshops/$workshopSlug/');

function WorkshopDetailPage() {
  const { locale, workshopSlug } = routeApi.useParams();
  
  const { data: workshop } = useSuspenseQuery(
    workshopQueryOptions(workshopSlug, locale),
  );

  if (!workshop) {
    return <div className="p-10 text-center">Workshop not found</div>;
  }

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <div>
        <Link to="/$locale/workshops" params={{ locale }} className="text-brand-teal hover:underline text-sm mb-4 inline-block">
          &larr; Back to Workshops
        </Link>
        <h1 className="text-4xl font-bold gradient-text mt-2">{workshop.title}</h1>
        <p className="text-xl text-muted-foreground mt-4">{workshop.description}</p>
        
        <div className="flex items-center gap-4 mt-6 flex-wrap">
           <a href={workshop.repoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground bg-secondary/50 px-3 py-1.5 rounded-full border border-border">
             <Github className="h-4 w-4" />
             {workshop.repoUrl}
           </a>
           {workshop.tags?.map(tag => (
             <Badge key={tag} variant="outline" className="text-xs bg-background">
               {tag}
             </Badge>
           ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold border-b border-border pb-2">Modules</h2>
        {workshop.modules.length === 0 ? (
          <p className="text-muted-foreground italic">No modules available yet.</p>
        ) : (
          <div className="space-y-4">
            {workshop.modules.map((mod, index) => (
              <Card key={mod.slug} className="glass-card flex flex-col md:flex-row items-start md:items-center justify-between p-4 hover:border-brand-teal/50 transition-colors gap-4">
                <div className="flex items-center gap-4 w-full">
                  <div className="h-10 w-10 bg-brand-teal/10 text-brand-teal rounded-full flex shrink-0 items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{mod.title}</h3>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                       <PlayCircle className="h-3 w-3" />
                       {mod.videoUrl ? 'Video Lesson' : 'Reading'}
                       <span>&bull;</span>
                       Branch: <code className="bg-secondary/50 px-1 rounded font-mono text-xs text-primary">{mod.branchName}</code>
                       <span>&bull;</span>
                       <span>{mod.xpReward} XP</span>
                    </div>
                  </div>
                </div>
                <Button asChild variant="secondary" className="group shrink-0">
                  <Link to={`/$locale/workshops/$workshopSlug/$moduleSlug`} params={{ locale, workshopSlug, moduleSlug: mod.slug }}>
                    Start
                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
