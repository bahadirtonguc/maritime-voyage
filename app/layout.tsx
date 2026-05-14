import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ToastProvider';
import { UppercaseInputs } from '@/components/UppercaseInputs';

export const metadata: Metadata = {
  title: 'Maritime Voyage Manager',
  description: 'Professional maritime voyage management and P&L tracking',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased">
        <UppercaseInputs />
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
