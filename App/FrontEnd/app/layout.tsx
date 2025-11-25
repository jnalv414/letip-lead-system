import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { AppProviders } from '@/core/providers/app-providers';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  title: 'LeTip Lead System Dashboard',
  description: 'Real-time business lead generation and enrichment dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-[var(--bg-primary)] text-[var(--text-primary)]`}>
        <AppProviders>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={4000}
            toastOptions={{
              className: 'sonner-toast',
              style: {
                background: '#1e293b',
                border: '1px solid rgba(51, 65, 85, 0.5)',
                color: '#f1f5f9',
              },
            }}
          />
        </AppProviders>
      </body>
    </html>
  );
}