import { createFileRoute, Link, getRouteApi } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { confirmSubscription } from '@/server/newsletter.fn';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { z } from 'zod';
import { createSeoHead } from '@/lib/seo';

const searchSchema = z.object({
    token: z.string().optional(),
});

export const Route = createFileRoute('/$locale/confirm-subscription')({
    validateSearch: searchSchema,
    component: ConfirmSubscriptionPage,
    head: ({ params }) => {
        const locale = params.locale || 'en';
        return createSeoHead({
            title: 'Confirm Subscription | TestingWithEkki',
            description: 'Confirm your newsletter subscription for TestingWithEkki.',
            path: '/confirm-subscription',
            locale,
            noIndex: true,
        });
    },
});

const routeApi = getRouteApi('/$locale/confirm-subscription');

function ConfirmSubscriptionPage() {
    const { token } = routeApi.useSearch();
    const { locale } = routeApi.useParams();

    const { isLoading, error } = useQuery({
        queryKey: ['confirm-subscription', token],
        queryFn: async () => {
            if (!token) throw new Error('No token provided');
            const res = await confirmSubscription({ data: { token } });
            if (!res.success) throw new Error(res.error || 'Failed to confirm subscription');
            return res;
        },
        enabled: !!token,
        retry: false,
    });

    if (!token) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                            <XCircle className="w-6 h-6 text-yellow-600" />
                        </div>
                        <CardTitle>Invalid Link</CardTitle>
                        <CardDescription>
                            This confirmation link appears to be invalid or missing a token.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button asChild>
                            <Link to="/">Return Home</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <Card className="w-full max-w-md text-center shadow-lg border-primary/10">
                <CardHeader>
                    {isLoading ? (
                        <div className="mx-auto w-12 h-12 flex items-center justify-center mb-4">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                    ) : (
                        <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    )}

                    <CardTitle>
                        {isLoading
                            ? 'Verifying...'
                            : error
                                ? 'Verification Failed'
                                : 'Subscription Confirmed!'}
                    </CardTitle>
                    <CardDescription>
                        {isLoading
                            ? 'Please wait while we confirm your subscription.'
                            : error
                                ? (error).message
                                : 'Thank you for subscribing to the TestingWithEkki newsletter. You will now receive updates on new tutorials and challenges.'}
                    </CardDescription>
                </CardHeader>

                {!isLoading && (
                    <CardContent>
                        {error ? (
                            <p className="text-sm text-muted-foreground">
                                The link may have expired or was already used. Please try subscribing again.
                            </p>
                        ) : null}
                    </CardContent>
                )}

                <CardFooter className="justify-center">
                    <Button asChild className="gap-2">
                        <Link to={`/${locale}/tutorials`}>
                            Explore Tutorials <ArrowRight className="w-4 h-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
