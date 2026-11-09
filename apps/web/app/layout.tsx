import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VersionFlow — API Ecosystem Intelligence',
  description: 'Developer-first API Ecosystem Intelligence & Lifecycle Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}

