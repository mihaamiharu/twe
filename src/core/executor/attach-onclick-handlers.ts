/**
 * Attach Onclick Handlers
 *
 * Shared utility to manually attach onclick handlers for elements with
 * inline onclick attributes. This is required because HappyDOM/iframe.write()
 * doesn't always wire up inline attributes to the correctly scoped window.
 */

export interface AttachOnclickHandlersOptions {
  document: Document;
  window: Window & Record<string, unknown>;
  /** Additional keys to exclude from the window function destructure */
  excludeKeys?: string[];
  /** Custom error message prefix for console.error */
  errorPrefix?: string;
}

const DEFAULT_EXCLUDE_KEYS = [
  'fetch',
  'setTimeout',
  'setInterval',
  'clearTimeout',
  'clearInterval',
];

/**
 * Manually attach onclick handlers for elements with the onclick attribute.
 *
 * Works around the limitation where inline event handlers don't execute
 * consistently in sandboxed iframes or HappyDOM environments.
 */
export function attachOnclickHandlers(options: AttachOnclickHandlersOptions): void {
  const { document: doc, window: win, excludeKeys = [], errorPrefix = 'onclick' } = options;

  const allExcludeKeys = [...new Set([...DEFAULT_EXCLUDE_KEYS, ...excludeKeys])];

  const elementsWithClick = Array.from(doc.querySelectorAll('[onclick]'));

  elementsWithClick.forEach((el) => {
    const handlerCode = el.getAttribute('onclick');
    if (!handlerCode || handlerCode.trim() === '') {
      el.removeAttribute('onclick');
      return;
    }

    try {
      const windowFuncs = Object.keys(win).filter(
        (key) =>
          typeof win[key] === 'function' &&
          !allExcludeKeys.includes(key),
      );

      const funcDestructure =
        windowFuncs.length > 0
          ? `const { ${windowFuncs.join(', ')} } = window;`
          : '';

      const code = `
        const fetch = window.fetch;
        ${funcDestructure}
        return (function(window, document, event) {
            try {
                ${handlerCode}
            } catch(err) {
                console.error('Error in ${errorPrefix} handler:', err);
            }
        }).call(this, window, document, event);
      `;

      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const fn = new Function('window', 'document', 'event', code);

      el.addEventListener('click', (event) => {
        fn.call(el, win, doc, event);
      });

      el.removeAttribute('onclick');
    } catch (e) {
      console.error(`Failed to attach ${errorPrefix} handler:`, e);
    }
  });
}
