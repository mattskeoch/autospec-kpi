import './globals.css';

export const metadata = { title: 'Autospec KPI' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

