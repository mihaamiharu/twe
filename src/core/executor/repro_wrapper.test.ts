
import { describe, it, expect as bunExpect } from 'bun:test';
import { createExpect } from './expect-matchers';

// Mock implementation of the IFrame Executor logic
async function simulateExecutor(
    userCodeFn: (test: any, expect: any) => void | Promise<void>,
) {
    const { expect, getAssertionCount } = createExpect({ timeout: 100 });
    const contentWindow: any = { __testPromises: [] };

    const test = (name: string, callback: (args: any) => Promise<void>) => {
        void name;
        const testPromise = (async () => {
            await callback({ page: {}, expect });
        })();
        if (Array.isArray(contentWindow.__testPromises)) {
            contentWindow.__testPromises.push(testPromise);
        }
        return testPromise;
    };

    // User code execution (sync usually, starts tests)
    // For top-level await simulation, we await it.
    await userCodeFn(test, expect);

    // Executor wait loop (simulates wrappedCode)
    try {
        if (contentWindow.__testPromises && Array.isArray(contentWindow.__testPromises)) {
            await Promise.all(contentWindow.__testPromises);
        }

        return { status: 'PASSED', count: getAssertionCount() };
    } catch (e) {
        console.error('Executor Caught Error:', e);
        return { status: 'FAILED', count: getAssertionCount(), error: e };
    }
}

describe('Executor Logic with Wrapper', () => {
    it('captures assertions inside test wrapper', async () => {
        const result = await simulateExecutor((test) => {
            test('wrapped test', async ({ expect }: any) => {
                await expect('actual').toHaveText('actual', { timeout: 50 });
            });
        });

        if (result.status === 'FAILED') console.log('Result Error:', result.error);
        bunExpect(result.status).toBe('PASSED');
        bunExpect(result.count).toBeGreaterThan(0);
    });

    it('captures failure inside test wrapper', async () => {
        const result = await simulateExecutor((test) => {
            test('wrapped failing test', async ({ expect }: any) => {
                await expect('actual').toHaveText('mismatch', { timeout: 50 });
            });
        });

        bunExpect(result.status).toBe('FAILED');
        bunExpect(result.count).toBeGreaterThan(0);
    });

    it('captures assertions at top level (unwrapped)', async () => {
        const result = await simulateExecutor(async (test, expect) => {
             await expect('actual').toHaveText('actual', { timeout: 50 });
        });

        bunExpect(result.status).toBe('PASSED');
        bunExpect(result.count).toBeGreaterThan(0);
    });
});
