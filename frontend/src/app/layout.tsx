import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Palato Ops',
  description: 'Palato Daily Operations Framework',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0F1117',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1E2535', color: '#E8EDF5', border: '1px solid #2A3347' },
            success: { iconTheme: { primary: '#22C55E', secondary: '#0D2818' } },
            error:   { iconTheme: { primary: '#EF4444', secondary: '#2A0A0A' } },
          }}
        />
      </body>
    </html>
  );
}
