import { getAccounts, getTransactions, getCategories } from '@/lib/data';
import type { Account, Transaction, TransactionEntry } from '@/lib/types';
import { notFound } from 'next/navigation';
import AccountLedgerClient from '@/components/accounts/AccountLedgerClient';
import { cookies } from 'next/headers';


type LedgerEntry = {
  transactionId: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
};

export default async function AccountLedgerPage({ params }: { params: { accountId: string } }) {
  const { accountId } = params;
  const activeBookId = cookies().get('activeBookId')?.value || 'book_default';

  const [accounts, transactions, categories] = await Promise.all([
    getAccounts(activeBookId),
    getTransactions(activeBookId),
    getCategories(activeBookId),
  ]);

  const account = accounts.find((a) => a.id === accountId);

  if (!account) {
    notFound();
  }

  const categoryName = categories.find(c => c.id === account.categoryId)?.name || 'Uncategorized';

  const relevantTransactions = transactions
    .filter((t) => t.entries.some((e) => e.accountId === accountId))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = 0;

  const ledgerEntries: LedgerEntry[] = relevantTransactions.map((tx) => {
    const entry = tx.entries.find((e) => e.accountId === accountId)!;
    const debit = entry.type === 'debit' ? entry.amount : 0;
    const credit = entry.type === 'credit' ? entry.amount : 0;

    runningBalance += debit - credit;

    return {
      transactionId: tx.id,
      date: tx.date,
      // Use entry description if available, otherwise fall back to transaction description
      description: entry.description || tx.description,
      debit,
      credit,
      balance: runningBalance,
    };
  });
  
  // Reverse for display purposes (most recent first)
  const displayEntries = ledgerEntries.reverse();
  const finalBalance = displayEntries.length > 0 ? displayEntries[0].balance : 0;


  return <AccountLedgerClient account={account} ledgerEntries={displayEntries} finalBalance={finalBalance} categoryName={categoryName}/>;
}
