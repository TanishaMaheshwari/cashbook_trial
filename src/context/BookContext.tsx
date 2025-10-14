'use client';

import type { Book } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getBooks } from '@/lib/data';

interface BookContextType {
  books: Book[];
  activeBook: Book | null;
  setActiveBook: (book: Book | null) => void;
  isLoading: boolean;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

export const BookProvider = ({ children }: { children: ReactNode }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBook, setActiveBookState] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBooks = async () => {
      setIsLoading(true);
      const fetchedBooks = await getBooks();
      setBooks(fetchedBooks);

      const storedBookId = localStorage.getItem('activeBookId');
      const bookToActivate = fetchedBooks.find(b => b.id === storedBookId) || fetchedBooks[0] || null;
      
      setActiveBookState(bookToActivate);
      if (bookToActivate) {
          localStorage.setItem('activeBookId', bookToActivate.id);
      }
      setIsLoading(false);
    };

    loadBooks();
  }, []);
  
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
