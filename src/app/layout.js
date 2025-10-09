import './globals.css';
import 'remixicon/fonts/remixicon.css';

export const metadata = { title: 'Autospec MTD Sales Dashboard' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

