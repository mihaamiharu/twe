import { json } from '@tanstack/react-start';
import { signInSchema, validateInput } from '@/lib/validations';
import { authClient } from '@/lib/auth.client';

export async function POST({ request }: { request: Request }) {
    try {
        const body = await request.json();

        // Validate input
        const validation = validateInput(signInSchema, body);
        if (!validation.success) {
            return json(
                { success: false, error: 'Validation failed', errors: validation.errors },
                { status: 400 },
            );
        }

        const { email, password } = validation.data;

        // Use BetterAuth client to sign in
        const result = await authClient.signIn.email({
            email,
            password,
        });

        if (result.error) {
            return json(
                { success: false, error: result.error.message || 'Invalid credentials' },
                { status: 401 },
            );
        }

        return json({ success: true, user: result.data?.user });
    } catch (error) {
        console.error('Sign in error:', error);
        return json(
            { success: false, error: 'An unexpected error occurred' },
            { status: 500 },
        );
    }
}
