'use client';

import { BookProvider } from '@/context/BookContext';
import type { Book } from '@/lib/types';

export default function AppShell({
  children,
  initialBooks,
}: {
  children: React.ReactNode;
  initialBooks: Book[];
}) {
  return (
    <BookProvider initialBooks={initialBooks}>
      {children}
    </BookProvider>
  );
}
