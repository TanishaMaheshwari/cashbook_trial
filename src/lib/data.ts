import type { Account, Category, Transaction, AccountType, Book } from '@/lib/types';
import fs from 'node:fs';
import path from 'node:path';

// This file contains functions to read and write data from the local filesystem.
// It is intended to be used only on the server side.

const dataDir = path.join(process.cwd(), 'src', 'lib', 'data');

const booksFilePath = path.join(dataDir, 'books.json');
const categoriesFilePath = path.join(dataDir, 'categories.json');
const accountsFilePath = path.join(dataDir, 'accounts.json');
const transactionsFilePath = path.join(dataDir, 'transactions.json');
const recycleBinFilePath = path.join(dataDir, 'recycle-bin.json');

const readData = <T>(filePath: string): T[] => {
  try {
    if (!fs.existsSync(filePath)) {
        // If the file doesn't exist, create it with an empty array.
        fs.writeFileSync(filePath, '[]', 'utf8');
        return [];
    }
    const jsonString = fs.readFileSync(filePath, 'utf8');
    // If the file is empty, return an empty array.
    if (!jsonString) {
        return [];
    }
    return JSON.parse(jsonString) as T[];
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    // In case of a parsing error or other issue, return an empty array to prevent crashes.
    return [];
  }
};

const writeData = <T>(filePath: string, data: T[]): void => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
  }
};

export const addToRecycleBin = (item: any) => {
    const bin = readData<any>(recycleBinFilePath);
    item.deletedAt = new Date().toISOString();
    bin.unshift(item); // Add to the beginning of the array
    writeData<any>(recycleBinFilePath, bin);
}

// --- Book Functions ---

export const getBooks = async (): Promise<Book[]> => {
  const books = readData<Book>(booksFilePath);
  if (books.length === 0) {
      const defaultBook = { id: 'book_default', name: 'CASHBOOK' };
      writeData<Book>(booksFilePath, [defaultBook]);
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
  writeData<Book>(booksFilePath, books);
  return newBook;
};

export const updateBook = async (id: string, name: string): Promise<Book> => {
  const books = await getBooks();
  const index = books.findIndex(b => b.id === id);
  if (index === -1) {
    throw new Error('Book not found.');
  }
  books[index].name = name;
  writeData<Book>(booksFilePath, books);
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
  addToRecycleBin({ ...deletedBook, type: 'book' });
  writeData<Book>(booksFilePath, books);
};


// --- Other Data Functions ---
export const getCategories = async (): Promise<Category[]> => {
  const categories = readData<Category>(categoriesFilePath);
  if (categories.length === 0) {
      const defaultCategories: Category[] = [
        { id: 'cat_cash', name: 'Cash' },
        { id: 'cat_capital', name: 'Capital' },
        { id: 'cat_party', name: 'Parties' },
        { id: 'cat_revenue', name: 'Revenue' },
        { id: 'cat_expense', name: 'Expenses' },
      ];
      writeData<Category>(categoriesFilePath, defaultCategories);
      return defaultCategories;
  }
  return categories;
};

export const getAccounts = async (): Promise<Account[]> => {
  const accounts = readData<Account>(accountsFilePath);
    if (accounts.length === 0) {
        const defaultAccount: Account = { 
            id: 'acc_equity_opening', 
            name: 'Opening Balance Equity', 
            categoryId: 'cat_capital', 
            type: 'equity' 
        };
        writeData<Account>(accountsFilePath, [defaultAccount]);
        return [defaultAccount];
    }
    return accounts;
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const transactions = readData<Transaction>(transactionsFilePath);
  // Return sorted by date descending
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  const transactions = await getTransactions();
  const newTransaction: Transaction = {
    ...transaction,
    id: `txn_${Date.now()}`,
  };
  transactions.unshift(newTransaction);
  writeData<Transaction>(transactionsFilePath, transactions);
  return newTransaction;
};

export const updateTransaction = async (id: string, transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  const transactions = await getTransactions();
  const index = transactions.findIndex(t => t.id === id);
  if (index === -1) {
    throw new Error('Transaction not found.');
  }
  const updatedTransaction = { ...transactions[index], ...transaction, id };
  transactions[index] = updatedTransaction;
  writeData<Transaction>(transactionsFilePath, transactions);
  return updatedTransaction;
};

export const updateTransactionHighlight = async (id: string, highlight: Transaction['highlight'] | null): Promise<void> => {
    const transactions = await getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) {
        throw new Error('Transaction not found.');
    }
    if (highlight) {
        transactions[index].highlight = highlight;
    } else {
        delete transactions[index].highlight;
    }
    writeData<Transaction>(transactionsFilePath, transactions);
};

export const addCategory = async (name: string): Promise<Category> => {
  const categories = await getCategories();
  const newCategory = { id: `cat_${Date.now()}`, name };
  if (categories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('Category already exists.');
  }
  categories.push(newCategory);
  writeData<Category>(categoriesFilePath, categories);
  return newCategory;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  let transactions = await getTransactions();
  const index = transactions.findIndex(t => t.id === id);
  if (index === -1) {
    throw new Error('Transaction not found.');
  }
  const [deletedTransaction] = transactions.splice(index, 1);
  addToRecycleBin({ ...deletedTransaction, type: 'transaction' });
  writeData<Transaction>(transactionsFilePath, transactions);
};

export const addAccount = async (account: Omit<Account, 'id' | 'openingBalance'> & { openingBalance?: number }): Promise<Account> => {
    const accounts = await getAccounts();
    const newAccount: Account = {
        name: account.name,
        categoryId: account.categoryId,
        type: account.type,
        id: `acc_${Date.now()}`,
    };
    accounts.push(newAccount);
    writeData<Account>(accountsFilePath, accounts);


    if (account.openingBalance && account.openingBalance > 0) {
      const isDebitAccount = ['asset', 'expense'].includes(account.type);
      
      const openingBalanceTransaction: Omit<Transaction, 'id'> = {
        date: new Date().toISOString(),
        description: `Opening balance for ${account.name}`,
        entries: [
          {
            accountId: newAccount.id,
            type: isDebitAccount ? 'debit' : 'credit',
            amount: account.openingBalance,
          },
          {
            accountId: 'acc_equity_opening', // This is a special account for this purpose.
            type: isDebitAccount ? 'credit' : 'debit',
            amount: account.openingBalance,
          },
        ],
      };
      await addTransaction(openingBalanceTransaction);
    }
    return newAccount;
};

export const deleteAccount = async (id: string): Promise<void> => {
    const transactions = await getTransactions();
    // Check if account has transactions
    const hasTransactions = transactions.some(t => t.entries.some(e => e.accountId === id));
    if (hasTransactions) {
        throw new Error('Cannot delete account with existing transactions.');
    }
    
    let accounts = await getAccounts();
    const index = accounts.findIndex(a => a.id === id);
    if (index === -1) {
        throw new Error('Account not found.');
    }
    accounts.splice(index, 1);
    writeData<Account>(accountsFilePath, accounts);
};

export const deleteMultipleAccounts = async (accountIds: string[]): Promise<void> => {
    const transactions = await getTransactions();
    const accounts = await getAccounts();

    let accountsToDelete = accounts.filter(acc => accountIds.includes(acc.id));
    
    for (const account of accountsToDelete) {
        const hasTransactions = transactions.some(t => t.entries.some(e => e.accountId === account.id));
        if (hasTransactions) {
            throw new Error(`Cannot delete account "${account.name}" because it has existing transactions.`);
        }
    }

    const remainingAccounts = accounts.filter(acc => !accountIds.includes(acc.id));
    writeData<Account>(accountsFilePath, remainingAccounts);
};
