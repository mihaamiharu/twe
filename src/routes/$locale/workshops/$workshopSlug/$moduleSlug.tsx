import { createFileRoute, Link, getRouteApi } from '@tanstack/react-router';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workshopModuleQueryOptions } from '@/lib/workshops.query';
import { markWorkshopModuleComplete } from '@/server/workshops.fn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Github, CheckCircle, ChevronLeft, Terminal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createSeoHead } from '@/lib/seo';
import { toast } from 'sonner';

export const Route = createFileRoute('/$locale/workshops/$workshopSlug/$moduleSlug')({
  loader: ({ context, params }) => {
    return context.queryClient.ensureQueryData(
      workshopModuleQueryOptions(params.workshopSlug, params.moduleSlug, params.locale),
    );
  },
  component: ModuleDetailPage,
  head: ({ params }) => {
    return createSeoHead({
      title: 'Module Detail',
      description: 'Hands-on guided learning workshops',
      path: `/workshops/${params.workshopSlug}/${params.moduleSlug}`,
      locale: params.locale || 'en',
    });
  },
});

const routeApi = getRouteApi('/$locale/workshops/$workshopSlug/$moduleSlug');

function ModuleDetailPage() {
  const { locale, workshopSlug, moduleSlug } = routeApi.useParams();
  
  const queryClient = useQueryClient();
  
  const { data: result } = useSuspenseQuery(
    workshopModuleQueryOptions(workshopSlug, moduleSlug, locale),
  );

  const mutation = useMutation({
    mutationFn: () => markWorkshopModuleComplete({ data: { workshopSlug, moduleSlug } }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ['workshopModule', workshopSlug, moduleSlug, locale],
      });
      
      if (res.xpEarned > 0) {
        toast.success(`Module Completed! Earned ${res.xpEarned} XP!`);
      } else {
        toast.info(res.message);
      }
    },
    onError: (err) => {
      toast.error('Failed to mark complete: ' + err.message);
    }
  });

  if (!result) {
    return <div className="p-10 text-center">Module not found</div>;
  }

  const { workshop, module, isCompleted } = result as any;

  let youtubeId = '';
  if (module.videoUrl) {
    const url = module.videoUrl;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    youtubeId = match ? match[1] : url; 
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="gap-1 px-2 -ml-2 text-muted-foreground">
              <Link to="/$locale/workshops/$workshopSlug" params={{ locale, workshopSlug }}>
                <ChevronLeft className="h-4 w-4" />
                Back to {workshop.title}
              </Link>
            </Button>
          </div>
          <Button 
            onClick={() => mutation.mutate()} 
            disabled={mutation.isPending || isCompleted}
            className="gap-2 shadow-sm"
            variant={isCompleted ? "secondary" : "default"}
          >
            <CheckCircle className="h-4 w-4" />
            {isCompleted ? "Completed" : "Mark as Complete"}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-10">
        <div>
          <Badge variant="outline" className="mb-4">{workshop.title}</Badge>
          <h1 className="text-3xl md:text-5xl font-bold">{module.title}</h1>
        </div>

        {youtubeId && (
          <div className="aspect-video w-full rounded-xl overflow-hidden border border-border shadow-lg bg-black">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="border-0"
            ></iframe>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 prose prose-zinc dark:prose-invert max-w-none prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-border">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {module.content}
            </ReactMarkdown>
            {!module.content && <p className="text-muted-foreground italic">No reading material for this module.</p>}
          </div>

          <div className="space-y-6">
             <div className="p-5 rounded-xl border border-border bg-card/50 shadow-sm space-y-4">
                <div className="flex items-center gap-2 font-semibold">
                   <Terminal className="h-5 w-5 text-brand-teal" />
                   Hands-on Practice
                </div>
                <p className="text-sm text-muted-foreground">
                  To follow along with this module, pull the latest changes from the repository and checkout the module's branch:
                </p>
                
                <div className="space-y-2">
                   <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Repository</div>
                   <a href={workshop.repoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline break-all">
                     <Github className="h-4 w-4 shrink-0" />
                     {workshop.repoUrl}
                   </a>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/50">
                   <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Commands</div>
                   <div className="bg-zinc-950 text-zinc-50 p-3 rounded-md font-mono text-xs overflow-x-auto border border-border">
                      <div className="select-all">git fetch origin</div>
                      <div className="select-all mt-1">git checkout {module.branchName}</div>
                   </div>
                </div>
             </div>
             
             <div className="p-5 rounded-xl border border-brand-teal/20 bg-brand-teal/5 flex items-start gap-4">
                 <CheckCircle className="h-5 w-5 text-brand-teal shrink-0 mt-0.5" />
                 <div>
                   <h4 className="font-semibold text-sm">Reward</h4>
                   <p className="text-sm text-muted-foreground mt-1">Complete this module and click the "Mark as Complete" button to earn <strong className="text-foreground">{module.xpReward} XP</strong>.</p>
                 </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
