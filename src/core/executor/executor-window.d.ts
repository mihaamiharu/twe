import type { ExecutorTestFunction, ExpectFunction } from './executor.types';
import type { MockedPlaywrightPage } from './playwright-shim';
import type { RouteMatcher } from './route-fetch-mock';
import type { DialogType } from './shim.types';

declare global {
  interface Window {
    __APP_STATE__?: Record<string, unknown>;
    __MOCK_DIALOG_HANDLER__?: (
      type: DialogType,
      message: string,
      defaultValue?: string,
    ) => Promise<unknown>;
    __MOCK_FETCH_PATCHED__?: boolean;
    __MOCK_ROUTES__?: RouteMatcher[];
    __VFS_NAVIGATE__?: (path: string) => void;
    __executionError?: string;
    __returnValue?: unknown;
    __testPromises?: Promise<unknown>[];
    expect?: ExpectFunction;
    happyDOM?: unknown;
    page?: MockedPlaywrightPage;
    /** Raw page reserved for the internal VFS bridge; learner code receives `page`. */
    __VFS_PAGE__?: MockedPlaywrightPage;
    test?: ExecutorTestFunction;
    console: Console;
    eval: (code: string) => unknown;
  }
}

export {};
