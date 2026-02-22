import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import QueryProvider from '@/lib/query-provider';
import { ThemeProvider } from '@/lib/theme-provider';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SocialAutoPro — Social Media Automation',
  description:
    'Single User Social Media Automation System for Facebook, LinkedIn & Telegram',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <QueryProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className:
                  '!bg-card !text-card-foreground !border !border-border !shadow-lg',
                success: {
                  iconTheme: { primary: '#22c55e', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#fff' },
                },
              }}
            />
            <DashboardLayout>{children}</DashboardLayout>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
