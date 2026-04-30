import { describe, test, expect } from 'bun:test';
import {
  generateIframeTemplate,
  generateVfsNavigationTemplate,
} from '../../core/executor/iframe-template';

describe('generateIframeTemplate', () => {
  test('should generate valid HTML document', () => {
    const html = generateIframeTemplate({
      bodyContent: '<h1>Hello</h1>',
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html>');
    expect(html).toContain('</html>');
    expect(html).toContain('<body>');
    expect(html).toContain('<h1>Hello</h1>');
  });

  test('should include body content', () => {
    const html = generateIframeTemplate({
      bodyContent: '<div class="test">Content</div>',
    });

    expect(html).toContain('<div class="test">Content</div>');
  });

  test('should include CSS content when provided', () => {
    const html = generateIframeTemplate({
      bodyContent: '<h1>Test</h1>',
      cssContent: '.test { color: red; }',
    });

    expect(html).toContain('.test { color: red; }');
  });

  test('should include base href', () => {
    const html = generateIframeTemplate({
      bodyContent: '<h1>Test</h1>',
    });

    expect(html).toContain('<base href="http://localhost/" />');
  });

  test('should include charset meta tag', () => {
    const html = generateIframeTemplate({
      bodyContent: '<h1>Test</h1>',
    });

    expect(html).toContain('<meta charset="utf-8">');
  });

  test('should include fetch polyfill', () => {
    const html = generateIframeTemplate({
      bodyContent: '<h1>Test</h1>',
    });

    expect(html).toContain('window.fetch = function');
    expect(html).toContain('__MOCK_ROUTES__');
  });

  test('should include alert polyfill when enabled', () => {
    const html = generateIframeTemplate({
      bodyContent: '<h1>Test</h1>',
      includeAlertPolyfill: true,
    });

    expect(html).toContain('window.alert = function');
    expect(html).toContain('__MOCK_DIALOG_HANDLER__');
  });

  test('should not include alert polyfill when disabled', () => {
    const html = generateIframeTemplate({
      bodyContent: '<h1>Test</h1>',
      includeAlertPolyfill: false,
    });

    expect(html).not.toContain('window.alert = function');
  });

  test('should include VFS navigation when filesEnabled is true', () => {
    const html = generateIframeTemplate({
      bodyContent: '<h1>Test</h1>',
      filesEnabled: true,
    });

    expect(html).toContain('__VFS_NAVIGATE__');
    expect(html).toContain('page.goto');
  });

  test('should include block navigation when filesEnabled is false', () => {
    const html = generateIframeTemplate({
      bodyContent: '<h1>Test</h1>',
      filesEnabled: false,
    });

    expect(html).not.toContain('__VFS_NAVIGATE__');
    expect(html).toContain('e.preventDefault()');
  });

  test('should include app state script when appState provided', () => {
    const html = generateIframeTemplate({
      bodyContent: '<h1>Test</h1>',
      appState: { count: 5, name: 'test' },
    });

    expect(html).toContain('__APP_STATE__');
    expect(html).toContain('"count":5');
  });

  test('should not include app state script when appState not provided', () => {
    const html = generateIframeTemplate({
      bodyContent: '<h1>Test</h1>',
    });

    expect(html).not.toContain('__APP_STATE__');
  });

  test('should include polyfill guard', () => {
    const html = generateIframeTemplate({
      bodyContent: '<h1>Test</h1>',
    });

    expect(html).toContain("__tweVfsPolyfillInstalled");
  });

  test('should include wildcard support in fetch when enabled', () => {
    const html = generateIframeTemplate({
      bodyContent: '<h1>Test</h1>',
      includeWildcardSupport: true,
    });

    expect(html).toContain("route.matcher.includes('*')");
    expect(html).toContain('new RegExp');
  });
});

describe('generateVfsNavigationTemplate', () => {
  test('should generate valid HTML document', () => {
    const html = generateVfsNavigationTemplate({
      bodyContent: '<h1>VFS Page</h1>',
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<h1>VFS Page</h1>');
  });

  test('should include VFS navigation helper', () => {
    const html = generateVfsNavigationTemplate({
      bodyContent: '<h1>Test</h1>',
    });

    expect(html).toContain('__VFS_NAVIGATE__');
    expect(html).toContain('window.page.goto');
  });

  test('should include simplified fetch polyfill', () => {
    const html = generateVfsNavigationTemplate({
      bodyContent: '<h1>Test</h1>',
    });

    expect(html).toContain('window.fetch = function');
    expect(html).toContain('__MOCK_ROUTES__');
  });

  test('should include click handler for VFS navigation', () => {
    const html = generateVfsNavigationTemplate({
      bodyContent: '<h1>Test</h1>',
    });

    expect(html).toContain("e.target.closest('a[href]')");
    expect(html).toContain('e.preventDefault()');
  });

  test('should include submit handler for VFS navigation', () => {
    const html = generateVfsNavigationTemplate({
      bodyContent: '<h1>Test</h1>',
    });

    expect(html).toContain("form.getAttribute('action')");
  });

  test('should include app state when provided', () => {
    const html = generateVfsNavigationTemplate({
      bodyContent: '<h1>Test</h1>',
      appState: { page: 'home' },
    });

    expect(html).toContain('__APP_STATE__');
    expect(html).toContain('"page":"home"');
  });

  test('should include CSS content when provided', () => {
    const html = generateVfsNavigationTemplate({
      bodyContent: '<h1>Test</h1>',
      cssContent: 'body { background: white; }',
    });

    expect(html).toContain('body { background: white; }');
  });

  test('should include polyfill guard', () => {
    const html = generateVfsNavigationTemplate({
      bodyContent: '<h1>Test</h1>',
    });

    expect(html).toContain('__tweVfsPolyfillInstalled');
  });
});
