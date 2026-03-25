import './globals.css';
import { TRPCProvider } from '@/lib/trpc';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'NHCS',
  description: 'New Human Capital System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NuqsAdapter>
          <TRPCProvider>{children}</TRPCProvider>
        </NuqsAdapter>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
