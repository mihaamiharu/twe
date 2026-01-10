import { expect } from 'bun:test';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Setup DOM environment using Happy DOM
GlobalRegistrator.register();

// Add custom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});
