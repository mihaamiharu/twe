import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

describe('reduced motion styles', () => {
  test('collapses global animations and transitions while preserving default motion', async () => {
    const styles = await readFile(resolve(process.cwd(), 'src/styles.css'), 'utf8');
    const reducedMotionStart = styles.indexOf(
      '@media (prefers-reduced-motion: reduce)',
    );

    expect(reducedMotionStart).toBeGreaterThanOrEqual(0);

    const reducedMotionStyles = styles.slice(reducedMotionStart);
    expect(reducedMotionStyles).toContain('*,\n  *::before,\n  *::after');
    expect(reducedMotionStyles).toContain(
      'animation-duration: 0.001ms !important',
    );
    expect(reducedMotionStyles).toContain(
      'animation-iteration-count: 1 !important',
    );
    expect(reducedMotionStyles).toContain(
      'transition-duration: 0.001ms !important',
    );
    expect(styles).toContain(
      '--animate-practice-run: practice-run 4.8s ease-in-out infinite',
    );
  });
});
