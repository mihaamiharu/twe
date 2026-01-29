import { describe, test, expect, beforeEach } from 'bun:test';
import { MockedPlaywrightPage } from '../../core/executor/playwright-shim';

describe('Playwright Shim VFS (Multi-page Support)', () => {
  let page: MockedPlaywrightPage;
  const vfs = {
    '/index.html': '<h1>Home</h1><a href="/about.html" id="link">About</a>',
    '/about.html': '<h1>About</h1><form action="/index.html" id="form"><button type="submit">Back</button></form><script>window.aboutLoaded = true;</script>',
  };

  beforeEach(() => {
    document.body.innerHTML = '<iframe></iframe>';
    const iframe = document.querySelector('iframe')!;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) throw new Error('Iframe document not found');
    
    // We need to make sure the iframe has a window/document
    page = new MockedPlaywrightPage(iframeDoc);
  });

  test('should navigate using VFS', async () => {
    page.setVFS(vfs);
    await page.goto('/index.html');
    
    expect(await page.textContent('h1')).toBe('Home');
    expect(page.url()).toBe('/index.html');

    await page.goto('/about.html');
    expect(await page.textContent('h1')).toBe('About');
    expect(page.url()).toBe('/about.html');
  });

  test('should intercept link clicks for VFS navigation', async () => {
    let navigatedPath: string | undefined;
    page.setVFS(vfs, {
      onNavigate: (path) => { navigatedPath = path; }
    });
    
    await page.goto('/index.html');
    
    // Simulate link click in the shimmed environment
    const iframe = document.querySelector('iframe')!;
    const link = iframe.contentDocument?.getElementById('link');
    link?.click();

    // The click handler is async (it calls page.goto)
    // We might need a small delay
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(page.url()).toBe('/about.html');
    expect(navigatedPath).toBe('/about.html');
    expect(await page.textContent('h1')).toBe('About');
  });

  test('should intercept form submissions for VFS navigation', async () => {
    page.setVFS(vfs);
    await page.goto('/about.html');
    
    const iframe = document.querySelector('iframe')!;
    const form = iframe.contentDocument?.getElementById('form');
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(page.url()).toBe('/index.html');
    expect(await page.textContent('h1')).toBe('Home');
  });

  test('should re-execute scripts on VFS navigation', async () => {
    page.setVFS(vfs);
    await page.goto('/about.html');
    
    const iframe = document.querySelector('iframe')!;
    // @ts-ignore
    expect((iframe.contentWindow as any).aboutLoaded).toBe(true);
  });

  test('should restore onclick handlers on VFS navigation', async () => {
    const vfsWithOnclick = {
      '/click.html': '<button id="btn" onclick="window.clicked = true">Click Me</button>'
    };
    page.setVFS(vfsWithOnclick);
    await page.goto('/click.html');
    
    const iframe = document.querySelector('iframe')!;
    const btn = iframe.contentDocument?.getElementById('btn');
    btn?.click();
    
    // @ts-ignore
    expect((iframe.contentWindow as any).clicked).toBe(true);
  });

  test('should throw error if page missing in VFS', async () => {
    page.setVFS(vfs);
    expect(page.goto('/missing.html')).rejects.toThrow('Page not found in VFS');
  });
});
