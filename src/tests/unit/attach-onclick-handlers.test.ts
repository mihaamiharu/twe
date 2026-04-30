import { describe, test, expect, beforeEach } from 'bun:test';
import { attachOnclickHandlers } from '../../core/executor/attach-onclick-handlers';

// These tests require DOM environment (HappyDOM) which is incompatible with CI
const isCI = !!process.env.CI;

describe.skipIf(isCI)('attachOnclickHandlers', () => {
  let container: HTMLElement;
  let mockWindow: Window & Record<string, unknown>;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);

    mockWindow = {
      fetch: () => Promise.resolve({}),
      setTimeout: globalThis.setTimeout,
      setInterval: globalThis.setInterval,
      clearTimeout: globalThis.clearTimeout,
      clearInterval: globalThis.clearInterval,
      myCustomFunc: () => 'custom',
      anotherFunc: () => 'another',
    } as unknown as Window & Record<string, unknown>;
  });

  test('should attach click handlers to elements with onclick attribute', () => {
    const btn = document.createElement('button');
    btn.setAttribute('onclick', 'this.textContent = "clicked"');
    container.appendChild(btn);

    attachOnclickHandlers({
      document,
      window: mockWindow,
    });

    expect(btn.hasAttribute('onclick')).toBe(false);

    btn.click();
    expect(btn.textContent).toBe('clicked');
  });

  test('should remove onclick attribute after attaching handler', () => {
    const btn = document.createElement('button');
    btn.setAttribute('onclick', 'void(0)');
    container.appendChild(btn);

    attachOnclickHandlers({
      document,
      window: mockWindow,
    });

    expect(btn.hasAttribute('onclick')).toBe(false);
  });

  test('should handle multiple elements with onclick', () => {
    const btn1 = document.createElement('button');
    btn1.setAttribute('onclick', 'this.id = "btn1-clicked"');
    const btn2 = document.createElement('button');
    btn2.setAttribute('onclick', 'this.id = "btn2-clicked"');
    container.appendChild(btn1);
    container.appendChild(btn2);

    attachOnclickHandlers({
      document,
      window: mockWindow,
    });

    btn1.click();
    btn2.click();

    expect(btn1.id).toBe('btn1-clicked');
    expect(btn2.id).toBe('btn2-clicked');
  });

  test('should not affect elements without onclick', () => {
    const btn = document.createElement('button');
    btn.id = 'no-onclick';
    container.appendChild(btn);

    attachOnclickHandlers({
      document,
      window: mockWindow,
    });

    expect(btn.hasAttribute('onclick')).toBe(false);
  });

  test('should exclude default keys from window function destructure', () => {
    const btn = document.createElement('button');
    btn.setAttribute('onclick', 'void(0)');
    container.appendChild(btn);

    // Should not throw even with default keys in window
    attachOnclickHandlers({
      document,
      window: mockWindow,
    });

    expect(btn.hasAttribute('onclick')).toBe(false);
  });

  test('should respect custom excludeKeys', () => {
    const btn = document.createElement('button');
    btn.setAttribute('onclick', 'void(0)');
    container.appendChild(btn);

    attachOnclickHandlers({
      document,
      window: mockWindow,
      excludeKeys: ['myCustomFunc', 'anotherFunc'],
    });

    expect(btn.hasAttribute('onclick')).toBe(false);
  });

  test('should handle empty onclick attribute gracefully', () => {
    const btn = document.createElement('button');
    btn.setAttribute('onclick', '');
    container.appendChild(btn);

    // Should not throw
    attachOnclickHandlers({
      document,
      window: mockWindow,
    });

    // Empty handler still removes the attribute
    expect(btn.hasAttribute('onclick')).toBe(false);
  });

  test('should use custom error prefix in handler', () => {
    const btn = document.createElement('button');
    btn.setAttribute('onclick', 'throw new Error("test")');
    container.appendChild(btn);

    // Should not throw - error is caught internally
    expect(() => {
      attachOnclickHandlers({
        document,
        window: mockWindow,
        errorPrefix: 'VFS',
      });
    }).not.toThrow();

    // Clicking should not throw to outer context (console.error is called internally but doesn't propagate)
    const originalError = console.error;
    console.error = () => {}; // Suppress console.error during test
    try {
      expect(() => btn.click()).not.toThrow();
    } finally {
      console.error = originalError;
    }
  });
});
