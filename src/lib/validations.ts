import { z } from 'zod';

// Sign Up Schema
export const signUpSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must be less than 100 characters'),
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be less than 50 characters'),
});

// Sign In Schema
export const signInSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email'),
    password: z.string().min(1, 'Password is required'),
});

// Export types
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

// Validation helper
export function validateInput<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors: Record<string, string> = {};
    for (const error of result.error.errors) {
        const path = error.path.join('.');
        if (!errors[path]) {
            errors[path] = error.message;
        }
    }

    return { success: false, errors };
}
