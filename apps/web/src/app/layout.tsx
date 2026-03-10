export const metadata = {
  title: 'NHCS',
  description: 'New Human Capital System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
