import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { useEffect } from 'react';
import * as Sentry from '@sentry/react';

export function DefaultErrorComponent({ error }: { error: Error }) {
    const router = useRouter();
    const queryErrorResetBoundary = useQueryErrorResetBoundary();

    useEffect(() => {
        // Log the error to Sentry when the error boundary catches it
        Sentry.captureException(error);
    }, [error]);

    return (
        <div className="flex min-h-[80vh] items-center justify-center p-4">
            <Card className="w-full max-w-md border-destructive/50 bg-destructive/5 dark:bg-destructive/10">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive dark:bg-destructive/20">
                        <AlertCircle className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">Something went wrong</CardTitle>
                    <CardDescription>
                        An unexpected error occurred while rendering this page.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                    <p className="mb-2 font-mono text-xs bg-muted/50 p-2 rounded max-h-32 overflow-auto text-left">
                        {error.message || 'Unknown error'}
                    </p>
                </CardContent>
                <CardFooter className="flex justify-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => {
                            router.history.go(-1);
                        }}
                    >
                        Go Back
                    </Button>
                    <Button
                        onClick={() => {
                            // Invalidate all queries and reload the page
                            queryErrorResetBoundary.reset();
                            router.invalidate();
                            window.location.reload();
                        }}
                    >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
