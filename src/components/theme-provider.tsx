/**
 * Theme Provider
 *
 * Manages light/dark mode with localStorage persistence
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'twe-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Phase 1 intentionally presents one cohesive daytime theme. The provider
  // contract remains intact so Night Camp can be restored without a rewrite.
  const [theme, setThemeState] = useState<Theme>('light');
  const resolvedTheme = 'light' as const;

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('light');
  }, []);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(THEME_KEY, newTheme);
    setThemeState('light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
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
