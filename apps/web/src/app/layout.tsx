import './globals.css';
import { TRPCProvider } from '@/lib/trpc';

export const metadata = {
  title: 'NHCS',
  description: 'New Human Capital System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
