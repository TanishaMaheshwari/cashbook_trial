
'use client';

import type { Book } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface BookContextType {
  books: Book[];
  activeBook: Book | null;
  setActiveBook: (book: Book | null) => void;
  isLoading: boolean;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

export const BookProvider = ({ children, initialBooks }: { children: ReactNode, initialBooks: Book[] }) => {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [activeBook, setActiveBookState] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // This effect runs when `initialBooks` changes (e.g., after a server action)
    setBooks(initialBooks);

    const storedBookId = localStorage.getItem('activeBookId');
    let bookToActivate: Book | null = null;
    
    // Try to find the currently active book within the new list of books
    if (activeBook) {
      bookToActivate = initialBooks.find(b => b.id === activeBook.id) || null;
    }

    // If there's no active book, try to use the stored one
    if (!bookToActivate && storedBookId) {
        bookToActivate = initialBooks.find(b => b.id === storedBookId) || null;
    }

    // If still no book, default to the first one in the list
    if (!bookToActivate && initialBooks.length > 0) {
        bookToActivate = initialBooks[0];
    }
    
    // Only update state if the active book has actually changed
    if (bookToActivate?.id !== activeBook?.id) {
        setActiveBookState(bookToActivate);
    }
    
    // If there's an active book, ensure its cookie is set
    if (bookToActivate) {
        document.cookie = `activeBookId=${bookToActivate.id}; path=/; max-age=31536000`; // 1 year
        localStorage.setItem('activeBookId', bookToActivate.id);
    } else if (!bookToActivate && activeBook) {
        // This handles the case where the active book was deleted
        document.cookie = 'activeBookId=; path=/; max-age=-1';
        localStorage.removeItem('activeBookId');
    }
    
    setIsLoading(false);

  }, [initialBooks]);
  
  const setActiveBook = (book: Book | null) => {
    setActiveBookState(book);
    if (book) {
      document.cookie = `activeBookId=${book.id}; path=/; max-age=31536000`;
      localStorage.setItem('activeBookId', book.id);
    } else {
      document.cookie = 'activeBookId=; path=/; max-age=-1';
      localStorage.removeItem('activeBookId');
    }
    // Use window.location.href to force a full-page reload, breaking Next.js cache.
    window.location.href = '/';
  };

  const value = { books, activeBook, setActiveBook, isLoading };

  return (
    <BookContext.Provider value={value}>
      {children}
    </BookContext.Provider>
  );
};

export const useBooks = () => {
  const context = useContext(BookContext);
  if (context === undefined) {
    throw new Error('useBooks must be used within a BookProvider');
  }
  return context;
};
