'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { setTheme, setResolvedTheme, Theme, ResolvedTheme } from '@/store/theme.slice';

const THEME_STORAGE_KEY = 'd2d_theme';

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Get system preference
    const getSystemTheme = (): ResolvedTheme => {
      if (typeof window === 'undefined') return 'light';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    // Initialize from localStorage
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const theme = stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'system';

    store.dispatch(setTheme(theme));

    // Resolve theme
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    store.dispatch(setResolvedTheme(resolved));

    // Apply to document
    document.documentElement.setAttribute('data-theme', resolved);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const currentTheme = store.getState().theme.theme;
      if (currentTheme === 'system') {
        const newResolved = e.matches ? 'dark' : 'light';
        store.dispatch(setResolvedTheme(newResolved));
        document.documentElement.setAttribute('data-theme', newResolved);
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeInitializer>{children}</ThemeInitializer>
    </Provider>
  );
}
