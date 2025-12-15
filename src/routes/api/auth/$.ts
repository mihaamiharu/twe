import { auth } from '@/lib/auth.server';

// TanStack Start API route for BetterAuth
// Handles all auth-related requests at /api/auth/*

export async function GET({ request }: { request: Request }) {
    return await auth.handler(request);
}

export async function POST({ request }: { request: Request }) {
    return await auth.handler(request);
}
