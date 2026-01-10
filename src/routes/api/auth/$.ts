import { createFileRoute } from '@tanstack/react-router';
import { auth } from '@/server/auth.server';

// TanStack Start API route for BetterAuth
// Handles all auth-related requests at /api/auth/*

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: ({ request }) => auth.handler(request),
    },
  },
});
