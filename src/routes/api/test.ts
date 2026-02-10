import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/test')({
    loader: () => {
        return new Response('API Test OK', {
            headers: {
                'Content-Type': 'text/plain',
            },
        });
    },
});
