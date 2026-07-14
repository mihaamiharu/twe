/**
 * Theme Provider
 *
 * Provides the intentionally light-only Cozy Quest theme.
 */

import { createContext, useContext, useEffect, type ReactNode } from 'react';

interface ThemeContextType {
  // Consumers retain the shared editor-theme contract, while this provider
  // intentionally resolves to light only.
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('light');
  }, []);

  return (
    <ThemeContext.Provider value={{ resolvedTheme: 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
