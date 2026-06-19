import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Amior — One Intelligence. Unlimited Possibilities.',
  description: 'Amior is an intelligent AI assistant built for real conversations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-midnight text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
