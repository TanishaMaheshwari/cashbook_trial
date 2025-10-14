import type { Account, Category, Transaction, AccountType } from '@/lib/types';

// In-memory store to simulate a database. This will be reset on server restart.
let categories: Category[] = [
  { id: 'cat_cash', name: 'Cash' },
  { id: 'cat_capital', name: 'Capital' },
  { id: 'cat_party', name: 'Parties' },
  { id: 'cat_revenue', name: 'Revenue' },
  { id: 'cat_expense', name: 'Expenses' },
];

let accounts: Account[] = [
  { id: 'acc_cash_hand', name: 'Cash in Hand', categoryId: 'cat_cash', type: 'asset' },
  { id: 'acc_bank', name: 'Bank Account', categoryId: 'cat_cash', type: 'asset' },
  { id: 'acc_capital', name: 'Owner\'s Capital', categoryId: 'cat_capital', type: 'equity' },
  { id: 'acc_supplier_a', name: 'Supplier A', categoryId: 'cat_party', type: 'liability' },
  { id: 'acc_customer_b', name: 'Customer B', categoryId: 'cat_party', type: 'asset' }, // Accounts Receivable
  { id: 'acc_sales', name: 'Product Sales', categoryId: 'cat_revenue', type: 'revenue' },
  { id: 'acc_rent', name: 'Office Rent', categoryId: 'cat_expense', type: 'expense' },
  { id: 'acc_supplies', name: 'Office Supplies', categoryId: 'cat_expense', type: 'expense' },
];

let transactions: Transaction[] = [
  {
    id: 'txn_1',
    date: new Date('2023-10-01').toISOString(),
    description: 'Initial capital investment',
    entries: [
      { accountId: 'acc_bank', type: 'debit', amount: 50000 },
      { accountId: 'acc_capital', type: 'credit', amount: 50000 },
    ],
  },
  {
    id: 'txn_2',
    date: new Date('2023-10-05').toISOString(),
    description: 'Paid office rent for October',
    entries: [
      { accountId: 'acc_rent', type: 'debit', amount: 2000 },
      { accountId: 'acc_bank', type: 'credit', amount: 2000 },
    ],
  },
  {
    id: 'txn_3',
    date: new Date('2023-10-10').toISOString(),
    description: 'Sale to Customer B on credit',
    entries: [
      { accountId: 'acc_customer_b', type: 'debit', amount: 5000 },
      { accountId: 'acc_sales', type: 'credit', amount: 5000 },
    ],
  },
  {
    id: 'txn_4',
    date: new Date('2023-10-15').toISOString(),
    description: 'Purchased supplies from Supplier A on credit',
    entries: [
      { accountId: 'acc_supplies', type: 'debit', amount: 750 },
      { accountId: 'acc_supplier_a', type: 'credit', amount: 750 },
    ],
  },
  {
    id: 'txn_5',
    date: new Date('2023-10-20').toISOString(),
    description: 'Received payment from Customer B',
    entries: [
      { accountId: 'acc_bank', type: 'debit', amount: 2500 },
      { accountId: 'acc_customer_b', type: 'credit', amount: 2500 },
    ],
  },
];


// Data access functions
export const getCategories = async (): Promise<Category[]> => {
  return JSON.parse(JSON.stringify(categories));
};

export const getAccounts = async (): Promise<Account[]> => {
  return JSON.parse(JSON.stringify(accounts));
};

export const getTransactions = async (): Promise<Transaction[]> => {
  // Return sorted by date descending
  return JSON.parse(JSON.stringify(transactions)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  const newTransaction: Transaction = {
    ...transaction,
    id: `txn_${Date.now()}`,
  };
  transactions.unshift(newTransaction);
  return newTransaction;
};

export const addCategory = async (name: string): Promise<Category> => {
  const newCategory = { id: `cat_${Date.now()}`, name };
  if (categories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('Category already exists.');
  }
  categories.push(newCategory);
  return newCategory;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const index = transactions.findIndex(t => t.id === id);
  if (index === -1) {
    throw new Error('Transaction not found.');
  }
  transactions.splice(index, 1);
};

export const addAccount = async (account: Omit<Account, 'id'>): Promise<Account> => {
    const newAccount: Account = {
        ...account,
        id: `acc_${Date.now()}`,
    };
    accounts.push(newAccount);
    return newAccount;
};

export const deleteAccount = async (id: string): Promise<void> => {
    // Check if account has transactions
    const hasTransactions = transactions.some(t => t.entries.some(e => e.accountId === id));
    if (hasTransactions) {
        throw new Error('Cannot delete account with existing transactions.');
    }
    const index = accounts.findIndex(a => a.id === id);
    if (index === -1) {
        throw new Error('Account not found.');
    }
    accounts.splice(index, 1);
};
