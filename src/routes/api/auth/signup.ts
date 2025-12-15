import { json } from '@tanstack/react-start';
import { signUpSchema, validateInput } from '@/lib/validations';
import { authClient } from '@/lib/auth.client';

export async function POST({ request }: { request: Request }) {
    try {
        const body = await request.json();

        // Validate input
        const validation = validateInput(signUpSchema, body);
        if (!validation.success) {
            return json(
                { success: false, error: 'Validation failed', errors: validation.errors },
                { status: 400 },
            );
        }

        const { email, password, name } = validation.data;

        // Use BetterAuth client to sign up
        const result = await authClient.signUp.email({
            email,
            password,
            name,
        });

        if (result.error) {
            return json(
                { success: false, error: result.error.message || 'Registration failed' },
                { status: 400 },
            );
        }

        return json({ success: true, user: result.data?.user });
    } catch (error) {
        console.error('Sign up error:', error);
        return json(
            { success: false, error: 'An unexpected error occurred' },
            { status: 500 },
        );
    }
}
