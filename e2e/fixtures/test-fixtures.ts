import { test as base } from '@playwright/test';
import { loginViaApi } from '../utils/auth';

export type TestFixtures = {
  // We can expose the authed page or just ensure the default page is authed
  // Let's create a fixture called 'authedPage' that ensures login
  authedPage: import('@playwright/test').Page;
};

export const test = base.extend<TestFixtures>({
  authedPage: async ({ page, context, request }, use) => {
    // Perform API login
    await loginViaApi(context, request);

    // Use the page
    await use(page);
  },
});

export { expect } from '@playwright/test';
