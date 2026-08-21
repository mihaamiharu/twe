import { executePlaywrightCode } from '../core/executor/iframe-executor';

// Mock browser APIs
if (typeof window === 'undefined') {
  const parentWindow = {
    name: 'Parent Window',
    secret: 'super_secret_token',
  };

  // Simple mock of window/iframe relationship
  Reflect.set(global, 'window', parentWindow);
  Reflect.set(global, 'document', {
    createElement: (tag: string) => {
      if (tag === 'iframe') {
        const contentWindow = {
          parent: parentWindow,
        };
        return {
          style: {},
          sandbox: { add: () => {} },
          contentDocument: {
            open: () => {},
            write: () => {},
            close: () => {},
            querySelectorAll: () => [],
            // In same-origin, contentWindow has ref to parent
            defaultView: contentWindow,
          },
          contentWindow,
          parentNode: null,
        };
      }
      return {};
    },
    body: {
      appendChild: (element: unknown) => {
        if (typeof element === 'object' && element !== null) {
          Reflect.set(element, 'parentNode', {});
        }
      },
      removeChild: () => {},
    },
  });
}

async function checkSecurity() {
  console.log('Checking for parent access...');

  // Code that tries to access parent secret
  const maliciousCode = `
        try {
            // In the current implementation (new Function in parent),
            // 'this' or 'window' might be bound to iframe, but does it prevent accessing parent?
            // Actually, if we run in parent context, 'window' variable is shadowed,
            // but we can try to get out.

            // If allow-same-origin is true (which it is), accessing window.parent is allowed by browser policy.
            // But does our executor expose it?

            // 'window' arg is iframe window.
            // window.parent -> should point to parent.

            const p = window.parent;
            if (p && p.secret) {
                return "LEAKED: " + p.secret;
            }
            return "SAFE";
        } catch (e) {
            return "ERROR: " + e.message;
        }
    `;

  // We mock the iframe creation to ensure 'window.parent' exists in the mock
  const result = await executePlaywrightCode(maliciousCode, '<div></div>', {
    timeout: 1000,
  });

  console.log('Result:', result.returnValue);
}

void checkSecurity();
