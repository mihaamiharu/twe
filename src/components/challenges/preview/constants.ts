/**
 * Styles injected into the sandboxed iframe for highlighting
 */
export const HIGHLIGHT_STYLES = `
  .twe-target-highlight {
    outline: 3px solid #22c55e !important;
    outline-offset: 2px;
    box-shadow: inset 0 0 0 1000px rgba(34, 197, 94, 0.1) !important;
  }
  .twe-user-match {
    outline: 2px dashed #3b82f6 !important;
    outline-offset: 1px;
    box-shadow: inset 0 0 0 1000px rgba(59, 130, 246, 0.1) !important;
  }
  .twe-hover-highlight {
    outline: 2px solid #f59e0b !important;
    outline-offset: 1px;
    cursor: pointer;
  }
  .twe-no-match {
    outline: 2px solid #ef4444 !important;
  }
  
  /* Base Styles for Challenges */
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
    font-size: 0.9em;
  }
  th, td {
    border: 1px solid #e5e7eb;
    padding: 0.5rem 0.75rem;
    text-align: left;
  }
  th {
    background-color: #f9fafb;
    font-weight: 600;
    color: #374151;
  }
  
  @media (prefers-color-scheme: dark) {
    th, td { border-color: #374151; }
    th {
      background-color: #1f2937;
      color: #f3f4f6;
    }
  }
  
  .grid {
    display: grid;
    gap: 1rem;
  }

  * {
    transition: outline 0.15s ease, background-color 0.15s ease;
  }
`;

/**
 * JavaScript logic injected into the sandboxed iframe
 */
export const INJECTED_SCRIPTS = `
  function getElementPath(el) {
    const parts = [];
    while (el && el !== document.body) {
      let selector = el.tagName.toLowerCase();
      if (el.id) {
        selector += '#' + el.id;
      } else if (el.className && typeof el.className === 'string') {
        const classes = el.className.trim().split(/\\s+/).filter(c => !c.startsWith('twe-'));
        if (classes.length) {
          selector += '.' + classes.join('.');
        }
      }
      parts.unshift(selector);
      el = el.parentElement;
    }
    return parts.join(' > ');
  }

  function clearHighlights() {
    document.querySelectorAll('.twe-user-match, .twe-target-highlight')
      .forEach(el => {
        el.classList.remove('twe-user-match', 'twe-target-highlight');
      });
  }

  function highlightElements(selector, selectorType, className, targetSelector, targetSelectorType) {
    clearHighlights();
    if (!selector) return;

    try {
      let elements = [];
      if (selectorType === 'css') {
        elements = document.querySelectorAll(selector);
      } else {
        const result = document.evaluate(
          selector, 
          document, 
          null, 
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, 
          null
        );
        for (let i = 0; i < result.snapshotLength; i++) {
          elements.push(result.snapshotItem(i));
        }
      }

      elements.forEach(el => {
        if (el && el.classList) {
          el.classList.add(className);
        }
      });

      window.parent.postMessage({ 
        type: 'matchCount', 
        count: elements.length 
      }, '*');

      if (targetSelector) {
        let targetElements = [];
        try {
          if (targetSelectorType === 'css') {
            targetElements = Array.from(document.querySelectorAll(targetSelector));
          } else {
            const result = document.evaluate(
              targetSelector, 
              document, 
              null, 
              XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, 
              null
            );
            for (let i = 0; i < result.snapshotLength; i++) {
              targetElements.push(result.snapshotItem(i));
            }
          }

          const userSet = new Set(Array.from(elements));
          const targetSet = new Set(targetElements);
          
          const isValid = userSet.size === targetSet.size && 
                          [...userSet].every(x => targetSet.has(x));
          
          window.parent.postMessage({
            type: 'validationResult',
            isValid,
            matchCount: elements.length || 0
          }, '*');

        } catch (err) {
          console.error('Validation error:', err);
        }
      }

    } catch (err) {
      window.parent.postMessage({ 
        type: 'matchCount', 
        count: 0,
        error: err.message 
      }, '*');
    }
  }

  // Event Listeners for Iframe Interactions
  document.addEventListener('click', (e) => {
    const path = getElementPath(e.target);
    window.parent.postMessage({ type: 'elementClick', path }, '*');
    
    // Intercept Links for VFS
    const link = e.target.closest('a[href]');
    if (link && !link.getAttribute('target')) {
      const href = link.getAttribute('href');
      if (href && (href.startsWith('/') || href.endsWith('.html'))) {
        e.preventDefault();
        window.parent.postMessage({ type: 'vfsNavigate', path: href }, '*');
      }
    }
  });

  document.addEventListener('mouseover', (e) => {
    if (e.target !== document.body) {
      e.target.classList.add('twe-hover-highlight');
      const path = getElementPath(e.target);
      window.parent.postMessage({ type: 'elementHover', path }, '*');
    }
  });

  document.addEventListener('mouseout', (e) => {
    e.target.classList.remove('twe-hover-highlight');
    window.parent.postMessage({ type: 'elementHover', path: null }, '*');
  });

  document.addEventListener('submit', (e) => {
    const form = e.target;
    const action = form.getAttribute('action');
    if (!action || action === '#' || action.trim() === '') {
      e.preventDefault();
      return;
    }
    if (action.startsWith('/') || action.endsWith('.html')) {
      e.preventDefault();
      window.parent.postMessage({ type: 'vfsNavigate', path: action }, '*');
    }
  }, true);

  document.addEventListener('error', (e) => {
    const target = e.target;
    if (target && target.tagName === 'IMG' && !target.src.includes('placehold.co')) {
      const altText = target.alt || 'Image';
      target.src = 'https://placehold.co/600x400?text=' + encodeURIComponent(altText);
      target.style.objectFit = 'cover';
    }
  }, true);

  // Parent Message Listener
  window.addEventListener('message', (e) => {
    if (e.data.type === 'highlight') {
      highlightElements(
        e.data.selector, 
        e.data.selectorType, 
        e.data.className,
        e.data.targetSelector,
        e.data.targetSelectorType
      );
    } else if (e.data.type === 'clearHighlights') {
      clearHighlights();
    }
  });
`;
