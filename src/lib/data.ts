import type { Account, Category, Transaction, AccountType } from '@/lib/types';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'src', 'lib', 'data');

const categoriesFilePath = path.join(dataDir, 'categories.json');
const accountsFilePath = path.join(dataDir, 'accounts.json');
const transactionsFilePath = path.join(dataDir, 'transactions.json');

const readData = <T>(filePath: string): T[] => {
  try {
    const jsonString = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(jsonString) as T[];
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
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


// Data access functions
export const getCategories = async (): Promise<Category[]> => {
  return readData<Category>(categoriesFilePath);
};

export const getAccounts = async (): Promise<Account[]> => {
  return readData<Account>(accountsFilePath);
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
  const updatedTransaction = { ...transaction, id };
  transactions[index] = updatedTransaction;
  writeData<Transaction>(transactionsFilePath, transactions);
  return updatedTransaction;
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
  transactions.splice(index, 1);
  writeData<Transaction>(transactionsFilePath, transactions);
};

export const addAccount = async (account: Omit<Account, 'id'>): Promise<Account> => {
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
            accountId: 'acc_equity_opening',
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
