import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'AI Assignment Checker',
  description: 'Automated assignment evaluation using AI',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50" suppressHydrationWarning>
        <ErrorBoundary>
          <Toaster position="top-right" reverseOrder={false} />
          <header className="bg-white border-b">
            <div className="container mx-auto px-4 py-3 flex items-center gap-4">
              <a href="/" className="flex items-center gap-3">
                <img src="/logo.svg" alt="AI Assignment Checker" width={120} height={36} />
              </a>
            </div>
          </header>
          <main>{children}</main>
        </ErrorBoundary>
      </body>
    </html>
  );
}