import { afterEach, expect, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/components/theme-provider';

function ThemeProbe() {
  const { resolvedTheme } = useTheme();
  return <span>{resolvedTheme}</span>;
}

afterEach(() => {
  cleanup();
  document.documentElement.classList.remove('light', 'dark');
});

test('ThemeProvider always applies the light-only theme', () => {
  document.documentElement.classList.add('dark');

  render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );

  expect(screen.getByText('light')).toBeTruthy();
  expect(document.documentElement.classList.contains('light')).toBe(true);
  expect(document.documentElement.classList.contains('dark')).toBe(false);
});
