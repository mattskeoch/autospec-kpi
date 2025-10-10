'use client';
import { useTheme } from '@/components/ThemeProvider';

export default function ThemeToggle({ className = '' }) {
  const { resolvedTheme, toggle } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={toggle}
      className={`rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-black/5 dark:ring-white/10
                  bg-white/60 hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10 ${className}`}
      title={isDark ? 'Switch to light' : 'Switch to dark'}
      type="button"
    >
      <i className={`mr-1 ${isDark ? 'ri-sun-line' : 'ri-moon-line'}`} />
      {isDark ? 'Light' : 'Dark'}
    </button>
  );
}
