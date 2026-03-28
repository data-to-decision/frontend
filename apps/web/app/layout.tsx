import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Data2Decision',
  description: 'AI-native data intelligence platform for enterprises',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
