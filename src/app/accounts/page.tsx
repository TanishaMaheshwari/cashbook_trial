import { getAccounts, getCategories, getTransactions } from '@/lib/data';
import type { Account, Transaction, AccountType } from '@/lib/types';
import AccountsClient from '@/components/accounts/AccountsClient';

export default async function AllAccountsPage() {
  const [accounts, categories, transactions] = await Promise.all([
    getAccounts(),
    getCategories(),
    getTransactions(),
  ]);

  const accountsWithBalances = accounts.map((account) => {
    const accountEntries = transactions.flatMap(t => t.entries).filter(e => e.accountId === account.id);
    const totalDebit = accountEntries.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);
    const totalCredit = accountEntries.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);

    let balance = 0;
    if (account.type === 'asset' || account.type === 'expense') {
      balance = totalDebit - totalCredit;
    } else {
      balance = totalCredit - totalDebit;
    }

    return { ...account, balance };
  });

  const totalDebitBalance = accountsWithBalances
    .filter(a => ['asset', 'expense'].includes(a.type) && a.balance > 0)
    .reduce((sum, a) => sum + a.balance, 0);
    
  const totalCreditBalance = accountsWithBalances
    .filter(a => ['liability', 'equity', 'revenue'].includes(a.type) && a.balance > 0)
    .reduce((sum, a) => sum + a.balance, 0);


  return (
    <AccountsClient
      initialAccounts={accountsWithBalances}
      categories={categories}
      totals={{ debit: totalDebitBalance, credit: totalCreditBalance }}
    />
  );
}
