'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeCtx = createContext({
  theme: 'system',           // 'light' | 'dark' | 'system'
  resolvedTheme: 'dark',     // 'light' | 'dark'
  setTheme: () => { },
  toggle: () => { },
});

const THEME_KEY = 'theme';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('system');
  const [resolvedTheme, setResolvedTheme] = useState('dark');

  // Apply a theme to <html> and persist if explicit
  const apply = (t) => {
    const el = document.documentElement;
    if (t === 'dark') el.classList.add('dark');
    else el.classList.remove('dark');
  };

  // Init: read saved or system
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = saved || (sysDark ? 'dark' : 'light');
      setTheme(saved || 'system');     // keep 'system' if not explicitly saved
      setResolvedTheme(initial);
      apply(initial);
    } catch { }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to theme changes (explicit)
  useEffect(() => {
    if (theme === 'light' || theme === 'dark') {
      apply(theme);
      setResolvedTheme(theme);
      localStorage.setItem(THEME_KEY, theme);
      return;
    }
    // theme === 'system'
    try {
      localStorage.removeItem(THEME_KEY);
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const update = () => {
        const t = mq.matches ? 'dark' : 'light';
        apply(t);
        setResolvedTheme(t);
      };
      update();
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    } catch { }
  }, [theme]);

  const toggle = useMemo(
    () => () => setTheme((prev) => (prev === 'dark' || (prev === 'system' && resolvedTheme === 'dark')) ? 'light' : 'dark'),
    [resolvedTheme]
  );

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme, toggle }), [theme, resolvedTheme]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}
