import { getAccounts, getTransactions } from '@/lib/data';
import type { Account, Transaction, TransactionEntry } from '@/lib/types';
import { notFound } from 'next/navigation';
import AccountLedgerClient from '@/components/accounts/AccountLedgerClient';

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
  const [accounts, transactions] = await Promise.all([
    getAccounts(),
    getTransactions(),
  ]);

  const account = accounts.find((a) => a.id === accountId);

  if (!account) {
    notFound();
  }

  const relevantTransactions = transactions
    .filter((t) => t.entries.some((e) => e.accountId === accountId))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = 0;
  const isDebitAccount = account.type === 'asset' || account.type === 'expense';

  const ledgerEntries: LedgerEntry[] = relevantTransactions.map((tx) => {
    const entry = tx.entries.find((e) => e.accountId === accountId)!;
    const debit = entry.type === 'debit' ? entry.amount : 0;
    const credit = entry.type === 'credit' ? entry.amount : 0;

    if (isDebitAccount) {
      runningBalance += debit - credit;
    } else {
      runningBalance += credit - debit;
    }

    return {
      transactionId: tx.id,
      date: tx.date,
      description: tx.description,
      debit,
      credit,
      balance: runningBalance,
    };
  });
  
  // Reverse for display purposes (most recent first)
  const displayEntries = ledgerEntries.reverse();

  return <AccountLedgerClient account={account} ledgerEntries={displayEntries} />;
}
