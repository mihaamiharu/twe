
import { describe, it, expect as bunExpect } from 'bun:test';
import { createExpect } from './expect-matchers';
import type { ExpectFunction } from './executor.types';

interface SimulatedFixtures {
    page: Record<string, never>;
    expect: ExpectFunction;
}

type SimulatedTest = (
    name: string,
    callback: (fixtures: SimulatedFixtures) => Promise<void>,
) => Promise<void>;

// Mock implementation of the IFrame Executor logic
async function simulateExecutor(
    userCodeFn: (
        test: SimulatedTest,
        expect: ExpectFunction,
    ) => void | Promise<void>,
) {
    const { expect, getAssertionCount } = createExpect({ timeout: 100 });
    const testPromises: Promise<void>[] = [];

    const test: SimulatedTest = (name, callback) => {
        void name;
        const testPromise = (async () => {
            await callback({ page: {}, expect });
        })();
        testPromises.push(testPromise);
        return testPromise;
    };

    // User code execution (sync usually, starts tests)
    // For top-level await simulation, we await it.
    await userCodeFn(test, expect);

    // Executor wait loop (simulates wrappedCode)
    try {
        await Promise.all(testPromises);

        return { status: 'PASSED', count: getAssertionCount() };
    } catch (e) {
        console.error('Executor Caught Error:', e);
        return { status: 'FAILED', count: getAssertionCount(), error: e };
    }
}

describe('Executor Logic with Wrapper', () => {
    it('captures assertions inside test wrapper', async () => {
        const result = await simulateExecutor((test) => {
            void test('wrapped test', async ({ expect }) => {
                await expect('actual').toHaveText('actual', { timeout: 50 });
            });
        });

        if (result.status === 'FAILED') console.log('Result Error:', result.error);
        bunExpect(result.status).toBe('PASSED');
        bunExpect(result.count).toBeGreaterThan(0);
    });

    it('captures failure inside test wrapper', async () => {
        const result = await simulateExecutor((test) => {
            void test('wrapped failing test', async ({ expect }) => {
                await expect('actual').toHaveText('mismatch', { timeout: 50 });
            });
        });

        bunExpect(result.status).toBe('FAILED');
        bunExpect(result.count).toBeGreaterThan(0);
    });

    it('captures assertions at top level (unwrapped)', async () => {
        const result = await simulateExecutor(async (_test, expect) => {
             await expect('actual').toHaveText('actual', { timeout: 50 });
        });

        bunExpect(result.status).toBe('PASSED');
        bunExpect(result.count).toBeGreaterThan(0);
    });
});
