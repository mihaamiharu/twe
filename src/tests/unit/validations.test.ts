import { describe, test, expect } from 'bun:test';
import { signUpSchema, signInSchema, validateInput } from '../../lib/validations';

describe('Validations', () => {
    describe('signUpSchema', () => {
        test('should validate correct input', () => {
            const result = signUpSchema.safeParse({
                email: 'test@example.com',
                password: 'password123',
                name: 'John Doe'
            });
            expect(result.success).toBe(true);
        });

        test('should fail on invalid email', () => {
            const result = signUpSchema.safeParse({
                email: 'invalid-email',
                password: 'password123',
                name: 'John Doe'
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Please enter a valid email');
            }
        });

        test('should fail on short password', () => {
            const result = signUpSchema.safeParse({
                email: 'test@example.com',
                password: 'short',
                name: 'John Doe'
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Password must be at least 8 characters');
            }
        });

        test('should fail on short name', () => {
            const result = signUpSchema.safeParse({
                email: 'test@example.com',
                password: 'password123',
                name: 'A'
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Name must be at least 2 characters');
            }
        });
    });

    describe('signInSchema', () => {
        test('should validate correct input', () => {
            const result = signInSchema.safeParse({
                email: 'test@example.com',
                password: 'password123'
            });
            expect(result.success).toBe(true);
        });

        test('should fail on empty fields', () => {
            const result = signInSchema.safeParse({
                email: '',
                password: ''
            });
            expect(result.success).toBe(false);
        });
    });

    describe('validateInput helper', () => {
        test('should return formatted errors', () => {
            const result = validateInput(signUpSchema, {
                email: 'bad',
                password: '123',
                name: ''
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors).toHaveProperty('email');
                expect(result.errors).toHaveProperty('password');
                expect(result.errors).toHaveProperty('name');
            }
        });

        test('should return data on success', () => {
            const data = {
                email: 'test@example.com',
                password: 'password123',
                name: 'John Doe'
            };
            const result = validateInput(signUpSchema, data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(data);
            }
        });
    });
});
