import { getAccounts, getCategories, getTransactions } from '@/lib/data';
import AccountsClient from '@/components/accounts/AccountsClient';
import { cookies } from 'next/headers';

export default async function AllAccountsPage() {
  const activeBookId = cookies().get('activeBookId')?.value || 'book_default';

  const [accounts, categories, transactions] = await Promise.all([
    getAccounts(activeBookId),
    getCategories(activeBookId),
    getTransactions(activeBookId),
  ]);

  const accountsWithBalances = accounts.map((account) => {
    const accountEntries = transactions.flatMap(t => t.entries).filter(e => e.accountId === account.id);
    const totalDebit = accountEntries.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);
    const totalCredit = accountEntries.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);

    const balance = totalDebit - totalCredit;
    
    return { ...account, balance };
  });

  const totalDebitBalance = accountsWithBalances
    .filter(a => a.balance >= 0)
    .reduce((sum, a) => sum + a.balance, 0);
    
  const totalCreditBalance = accountsWithBalances
    .filter(a => a.balance < 0)
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);


  return (
    <AccountsClient
      initialAccounts={accountsWithBalances}
      categories={categories}
      totals={{ debit: totalDebitBalance, credit: totalCreditBalance }}
    />
  );
}
