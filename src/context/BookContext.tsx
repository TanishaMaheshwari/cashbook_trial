'use client';

import type { Book } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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

  useEffect(() => {
    // Books are now passed in, so we just need to set the active one.
    const storedBookId = localStorage.getItem('activeBookId');
    const bookToActivate = books.find(b => b.id === storedBookId) || books[0] || null;
    
    setActiveBookState(bookToActivate);
    if (bookToActivate) {
        localStorage.setItem('activeBookId', bookToActivate.id);
    }
    setIsLoading(false);
    // We update the books state if the initialBooks prop changes.
    setBooks(initialBooks);

  }, [initialBooks]);
  
  const setActiveBook = (book: Book | null) => {
    setActiveBookState(book);
    if (book) {
      localStorage.setItem('activeBookId', book.id);
    } else {
      localStorage.removeItem('activeBookId');
    }
  };

  return (
    <BookContext.Provider value={{ books, activeBook, setActiveBook, isLoading }}>
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
