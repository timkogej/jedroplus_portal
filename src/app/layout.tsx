import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jedro+ Upravljanje Terminov',
  description: 'Upravljajte svoje termine',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl">
      <body>{children}</body>
    </html>
  );
}
