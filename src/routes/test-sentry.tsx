import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { testServerError } from '@/server/test-sentry.fn';
import { useState } from 'react';

export const Route = createFileRoute('/test-sentry')({
    component: TestSentryPage,
});

function TestSentryPage() {
    const [serverError, setServerError] = useState<string | null>(null);

    const triggerClientError = () => {
        throw new Error('Test Client Error from React!');
    };

    const triggerServerError = async () => {
        try {
            await testServerError();
        } catch {
            // We expect this to fail, but we want to know if the server (middleware) caught it.
            // The middleware re-throws, so we catch it here to show user.
            setServerError('Server error triggered! Check Bun project in Sentry.');
        }
    };

    return (
        <div className="container mx-auto p-12 space-y-8">
            <h1 className="text-3xl font-bold">Sentry Verification</h1>
            <p className="text-muted-foreground">
                Click the buttons below to trigger errors and check your Sentry Dashboard.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Client-Side (React)</h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                        This will crash the component and show the Error Boundary.
                        Check your <b>React</b> project in Sentry.
                    </p>
                    <Button variant="destructive" onClick={triggerClientError}>
                        Throw Client Error
                    </Button>
                </div>

                <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Server-Side (Bun)</h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                        This triggers a server function that throws an error.
                        Check your <b>Bun</b> project in Sentry.
                    </p>
                    <Button variant="outline" onClick={() => void triggerServerError()}>
                        Throw Server Error
                    </Button>
                    {serverError && <p className="mt-2 text-green-600 font-medium">{serverError}</p>}
                </div>
            </div>
        </div>
    );
}
