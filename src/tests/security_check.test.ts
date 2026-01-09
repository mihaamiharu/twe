import { executePlaywrightCode } from '../lib/iframe-executor';

// Mock browser APIs
if (typeof window === 'undefined') {
    const parentWindow = {
        name: 'Parent Window',
        secret: 'super_secret_token'
    };

    // Simple mock of window/iframe relationship
    (global as any).window = parentWindow;
    (global as any).document = {
        createElement: (tag: string) => {
            if (tag === 'iframe') {
                const iframe: any = {
                    style: {},
                    sandbox: { add: () => {} },
                    contentDocument: {
                        open: () => {},
                        write: () => {},
                        close: () => {},
                        querySelectorAll: () => [],
                        // In same-origin, contentWindow has ref to parent
                        defaultView: {
                            parent: parentWindow
                        }
                    },
                    contentWindow: null, // set below
                    parentNode: null
                };
                iframe.contentWindow = iframe.contentDocument.defaultView;
                // Mock eval-like behavior if needed, but our executor uses new Function() in parent
                return iframe;
            }
            return {};
        },
        body: {
            appendChild: (el: any) => { el.parentNode = {}; },
            removeChild: () => {}
        }
    };
}

async function checkSecurity() {
    console.log("Checking for parent access...");

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
    const result = await executePlaywrightCode(maliciousCode, "<div></div>", { timeout: 1000 });

    console.log("Result:", result.returnValue);
}

checkSecurity();
