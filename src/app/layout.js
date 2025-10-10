// src/app/layout.js
import Script from 'next/script';
import { ThemeProvider } from '@/components/ThemeProvider';
import 'remixicon/fonts/remixicon.css';
import './globals.css';

export const metadata = {
  title: 'Autospec KPI',
  description: 'Near-live sales KPIs and leaderboard',
};

function ThemeInitScript() {
  // Runs before React hydrates to avoid flicker & hydration mismatches
  const js = `
(function(){
  try {
    var key = 'theme';
    var saved = localStorage.getItem(key);
    var sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var next = saved || (sysDark ? 'dark' : 'light');
    var el = document.documentElement;
    if (next === 'dark') el.classList.add('dark');
    else el.classList.remove('dark');
  } catch (e) {}
})();
`;
  return (
    <Script id="theme-init" strategy="beforeInteractive">
      {js}
    </Script>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-page text-body">{children}</body>
    </html>
  );
}
