import type { Account, Category, Transaction, AccountType, Book } from '@/lib/types';
import fs from 'node:fs/promises';
import path from 'node:path';

// This file contains functions to read and write data from the local filesystem.
// It is intended to be used only on the server side.

const dataDir = path.join(process.cwd(), 'src', 'lib', 'data');

const booksFilePath = path.join(dataDir, 'books.json');
const categoriesFilePath = path.join(dataDir, 'categories.json');
const accountsFilePath = path.join(dataDir, 'accounts.json');
const transactionsFilePath = path.join(dataDir, 'transactions.json');
const recycleBinFilePath = path.join(dataDir, 'recycle-bin.json');


const readData = async <T>(filePath: string): Promise<T[]> => {
  try {
    await fs.access(filePath);
    const jsonString = await fs.readFile(filePath, 'utf8');
    if (!jsonString) {
        return [];
    }
    return JSON.parse(jsonString) as T[];
  } catch (error: any) {
    if (error.code === 'ENOENT') { // File does not exist
        await fs.writeFile(filePath, '[]', 'utf8');
        return [];
    }
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
};

const writeData = async <T>(filePath: string, data: T[]): Promise<void> => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
  }
};

export const getRecycleBinItems = async (): Promise<any[]> => {
    return await readData<any>(recycleBinFilePath);
};

export const addToRecycleBin = async (item: any) => {
    const bin = await readData<any>(recycleBinFilePath);
    item.deletedAt = new Date().toISOString();
    bin.unshift(item); // Add to the beginning of the array
    await writeData<any>(recycleBinFilePath, bin);
}

// --- Book Functions ---

export const getBooks = async (): Promise<Book[]> => {
  const books = await readData<Book>(booksFilePath);
  if (books.length === 0) {
      const defaultBook = { id: 'book_default', name: 'CASHBOOK' };
      await writeData<Book>(booksFilePath, [defaultBook]);
      return [defaultBook];
  }
  return books;
};

export const addBook = async (name: string): Promise<Book> => {
  const books = await getBooks();
  if (books.find(b => b.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('A book with this name already exists.');
  }
  const newBook: Book = { id: `book_${Date.now()}`, name };
  books.push(newBook);
  await writeData<Book>(booksFilePath, books);
  return newBook;
};

export const updateBook = async (id: string, name: string): Promise<Book> => {
  const books = await getBooks();
  const index = books.findIndex(b => b.id === id);
  if (index === -1) {
    throw new Error('Book not found.');
  }
  books[index].name = name;
  await writeData<Book>(booksFilePath, books);
  return books[index];
};

export const deleteBook = async (id: string): Promise<void> => {
  if (id === 'book_default') {
      throw new Error('Cannot delete the default book.');
  }
  let books = await getBooks();
  const index = books.findIndex(b => b.id === id);
   if (index === -1) {
    throw new Error('Book not found.');
  }
  const [deletedBook] = books.splice(index, 1);
  await addToRecycleBin({ ...deletedBook, type: 'book' });
  await writeData<Book>(booksFilePath, books);
  
  // Also delete associated data
  let allTransactions = await readData<Transaction>(transactionsFilePath);
  let allAccounts = await readData<Account>(accountsFilePath);
  let allCategories = await readData<Category>(categoriesFilePath);

  await writeData(transactionsFilePath, allTransactions.filter(t => t.bookId !== id));
  await writeData(accountsFilePath, allAccounts.filter(a => a.bookId !== id));
  await writeData(categoriesFilePath, allCategories.filter(c => c.bookId !== id));

};


// --- Other Data Functions ---
export const getCategories = async (bookId: string): Promise<Category[]> => {
  const categories = await readData<Category>(categoriesFilePath);
  const bookCategories = categories.filter(c => c.bookId === bookId);

  if (bookCategories.length === 0 && bookId === 'book_default') {
      const defaultCategories: Category[] = [
        { id: 'cat_cash', name: 'Cash', bookId },
        { id: 'cat_capital', name: 'Capital', bookId },
        { id: 'cat_party', name: 'Parties', bookId },
        { id: 'cat_expense', name: 'Expenses', bookId },
      ];
      const allCategories = [...categories, ...defaultCategories];
      await writeData<Category>(categoriesFilePath, allCategories);
      return defaultCategories;
  }
  return bookCategories;
};

export const getAccounts = async (bookId: string): Promise<Account[]> => {
    const allAccounts = await readData<Account>(accountsFilePath);
    return allAccounts.filter(a => a.bookId === bookId);
};

export const getTransactions = async (bookId: string): Promise<Transaction[]> => {
  const transactions = await readData<Transaction>(transactionsFilePath);
  const bookTransactions = transactions.filter(t => t.bookId === bookId);
  // Return sorted by date descending
  return bookTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const addTransaction = async (bookId: string, transaction: Omit<Transaction, 'id' | 'bookId'>): Promise<Transaction> => {
  const allTransactions = await readData<Transaction>(transactionsFilePath);
  const newTransaction: Transaction = {
    ...transaction,
    id: `txn_${Date.now()}`,
    bookId: bookId
  };
  allTransactions.unshift(newTransaction);
  await writeData<Transaction>(transactionsFilePath, allTransactions);
  return newTransaction;
};

export const updateTransaction = async (bookId: string, id: string, transaction: Omit<Transaction, 'id' | 'bookId'>): Promise<Transaction> => {
  const allTransactions = await readData<Transaction>(transactionsFilePath);
  const index = allTransactions.findIndex(t => t.id === id && t.bookId === bookId);
  if (index === -1) {
    throw new Error('Transaction not found in this book.');
  }
  const updatedTransaction = { ...allTransactions[index], ...transaction, id, bookId };
  allTransactions[index] = updatedTransaction;
  await writeData<Transaction>(transactionsFilePath, allTransactions);
  return updatedTransaction;
};

export const updateTransactionHighlight = async (bookId: string, id: string, highlight: Transaction['highlight'] | null): Promise<void> => {
    const allTransactions = await readData<Transaction>(transactionsFilePath);
    const index = allTransactions.findIndex(t => t.id === id && t.bookId === bookId);
    if (index === -1) {
        throw new Error('Transaction not found.');
    }
    if (highlight) {
        allTransactions[index].highlight = highlight;
    } else {
        delete allTransactions[index].highlight;
    }
    await writeData<Transaction>(transactionsFilePath, allTransactions);
};

export const addCategory = async (bookId: string, name: string): Promise<Category> => {
  const allCategories = await readData<Category>(categoriesFilePath);
  const newCategory: Category = { id: `cat_${Date.now()}`, name, bookId };
  if (allCategories.find(c => c.name.toLowerCase() === name.toLowerCase() && c.bookId === bookId)) {
    throw new Error('Category already exists in this book.');
  }
  allCategories.push(newCategory);
  await writeData<Category>(categoriesFilePath, allCategories);
  return newCategory;
};

export const deleteCategory = async (bookId: string, id: string): Promise<void> => {
    const accounts = await getAccounts(bookId);
    const isCategoryInUse = accounts.some(acc => acc.categoryId === id);
    if (isCategoryInUse) {
        throw new Error('Cannot delete category. It is currently assigned to one or more accounts.');
    }

    let allCategories = await readData<Category>(categoriesFilePath);
    const index = allCategories.findIndex(c => c.id === id && c.bookId === bookId);
    if (index === -1) {
        throw new Error('Category not found.');
    }
    const [deletedCategory] = allCategories.splice(index, 1);
    await addToRecycleBin({ ...deletedCategory, type: 'category' });
    await writeData<Category>(allCategories, allCategories);
};

export const deleteTransaction = async (bookId: string, id: string): Promise<void> => {
  let allTransactions = await readData<Transaction>(transactionsFilePath);
  const index = allTransactions.findIndex(t => t.id === id && t.bookId === bookId);
  if (index === -1) {
    throw new Error('Transaction not found.');
  }
  const [deletedTransaction] = allTransactions.splice(index, 1);
  await addToRecycleBin({ ...deletedTransaction, type: 'transaction' });
  await writeData<Transaction>(transactionsFilePath, allTransactions);
};

export const addAccount = async (bookId: string, account: Omit<Account, 'id' | 'bookId'> & { openingDebit?: number, openingCredit?: number }): Promise<Account> => {
    const allAccounts = await readData<Account>(accountsFilePath);
    const newAccount: Account = {
        name: account.name,
        categoryId: account.categoryId,
        id: `acc_${Date.now()}`,
        bookId: bookId,
    };
    allAccounts.push(newAccount);
    await writeData<Account>(accountsFilePath, allAccounts);

    const openingBalance = account.openingDebit || account.openingCredit;
    if (openingBalance && openingBalance > 0) {
      console.warn("Opening balance was provided, but automatic transaction creation is disabled. Please create a manual transaction for the opening balance.");
    }
    return newAccount;
};

export const deleteAccount = async (bookId: string, id: string): Promise<void> => {
    const transactions = await getTransactions(bookId);
    // Check if account has transactions
    const hasTransactions = transactions.some(t => t.entries.some(e => e.accountId === id));
    if (hasTransactions) {
        throw new Error('Cannot delete account with existing transactions.');
    }
    
    let allAccounts = await readData<Account>(accountsFilePath);
    const index = allAccounts.findIndex(a => a.id === id && a.bookId === bookId);
    if (index === -1) {
        throw new Error('Account not found.');
    }
    allAccounts.splice(index, 1);
    await writeData<Account>(accountsFilePath, allAccounts);
};

export const deleteMultipleAccounts = async (bookId: string, accountIds: string[]): Promise<void> => {
    const transactions = await getTransactions(bookId);
    const allAccounts = await readData<Account>(accountsFilePath);
    const bookAccounts = allAccounts.filter(acc => acc.bookId === bookId);

    let accountsToDelete = bookAccounts.filter(acc => accountIds.includes(acc.id));
    
    for (const account of accountsToDelete) {
        const hasTransactions = transactions.some(t => t.entries.some(e => e.accountId === account.id));
        if (hasTransactions) {
            throw new Error(`Cannot delete account "${account.name}" because it has existing transactions.`);
        }
    }

    const remainingAccounts = allAccounts.filter(acc => !accountIds.includes(acc.id));
    await writeData<Account>(accountsFilePath, remainingAccounts);
};
