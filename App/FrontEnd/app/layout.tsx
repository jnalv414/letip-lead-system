import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { QueryProvider } from '@/providers/query-provider';
import { SocketProvider } from '@/providers/socket-provider';
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
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <QueryProvider>
          <SocketProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
              duration={4000}
              toastOptions={{
                className: 'sonner-toast',
                style: {
                  background: '#145A5A',
                  border: '1px solid rgba(255, 87, 34, 0.3)',
                  color: '#ffffff',
                },
              }}
            />
          </SocketProvider>
        </QueryProvider>
      </body>
    </html>
  );
}