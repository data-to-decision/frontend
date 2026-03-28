'use client';

import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './useStore';
import { setTheme, setResolvedTheme, Theme, ResolvedTheme } from '@/store/theme.slice';

const THEME_STORAGE_KEY = 'd2d_theme';

export function useTheme() {
  const dispatch = useAppDispatch();
  const { theme, resolvedTheme } = useAppSelector((state) => state.theme);

  // Get system preference
  const getSystemTheme = useCallback((): ResolvedTheme => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      dispatch(setTheme(stored));
    }
  }, [dispatch]);

  // Resolve and apply theme
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const resolved = theme === 'system' ? getSystemTheme() : theme;
    dispatch(setResolvedTheme(resolved));

    // Apply to document
    document.documentElement.setAttribute('data-theme', resolved);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolved === 'dark' ? '#1C1C1E' : '#FFFFFF');
    }
  }, [theme, getSystemTheme, dispatch]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const newResolved = e.matches ? 'dark' : 'light';
      dispatch(setResolvedTheme(newResolved));
      document.documentElement.setAttribute('data-theme', newResolved);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme, dispatch]);

  const updateTheme = useCallback(
    (newTheme: Theme) => {
      dispatch(setTheme(newTheme));
      if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      }
    },
    [dispatch]
  );

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    updateTheme(newTheme);
  }, [resolvedTheme, updateTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme: updateTheme,
    toggleTheme,
    isLight: resolvedTheme === 'light',
    isDark: resolvedTheme === 'dark',
  };
}
