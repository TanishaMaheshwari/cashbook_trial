import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { BookProvider } from '@/context/BookContext';
import { getBooks } from '@/lib/data';

export const metadata: Metadata = {
  title: 'LedgerBalance',
  description: 'A modern double-entry accounting app.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Always fetch all books for the provider
  const initialBooks = await getBooks();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <BookProvider initialBooks={initialBooks}>
          {children}
        </BookProvider>
        <Toaster />
      </body>
    </html>
  );
}
