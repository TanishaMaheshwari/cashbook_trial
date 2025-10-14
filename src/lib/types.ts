export type Category = {
  id: string;
  name: string;
};

// Based on accounting principles.
// Assets & Expenses increase with Debits.
// Liabilities, Equity & Revenue increase with Credits.
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export type Account = {
  id: string;
  name: string;
  categoryId: string;
  type: AccountType;
  openingBalance?: number;
};

export type TransactionEntry = {
  accountId: string;
  amount: number;
  type: 'debit' | 'credit';
};

export type Transaction = {
  id: string;
  date: string; // ISO string
  description: string;
  entries: TransactionEntry[];
};
