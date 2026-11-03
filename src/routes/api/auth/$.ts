import { createFileRoute } from '@tanstack/react-router';
import { handleAuthRequest } from '@/server/auth-handler';

// TanStack Start API route for BetterAuth
// Handles all auth-related requests at /api/auth/*

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => handleAuthRequest(request),
      POST: ({ request }) => handleAuthRequest(request),
    },
  },
});
