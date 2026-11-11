import type { Metadata } from 'next';
import './globals.css';
import './project-admin.css';
import './contract-viewer.css';
import './impact-intelligence.css';

export const metadata: Metadata = {
  title: 'VersionFlow — Change APIs with confidence',
  description: 'A living map of your APIs, versions, dependencies, and change impact.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="antialiased selection:bg-orange-500 selection:text-black">{children}</body></html>;
}
