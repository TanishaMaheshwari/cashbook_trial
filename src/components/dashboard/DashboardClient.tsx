'use client';

import type { Account, Category, Transaction } from '@/lib/types';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import AddTransactionForm from '@/components/transactions/AddTransactionForm';
import StatCards from './StatCards';
import RecentTransactions from './RecentTransactions';
import ManageCategories from './ManageCategories';

type DashboardClientProps = {
  initialTransactions: Transaction[];
  accounts: Account[];
  categories: Category[];
};

export default function DashboardClient({ initialTransactions, accounts, categories }: DashboardClientProps) {
  const [isAddTxSheetOpen, setAddTxSheetOpen] = useState(false);

  const stats = useMemo(() => {
    const totalDebit = initialTransactions.flatMap(t => t.entries).filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);
    const totalCredit = initialTransactions.flatMap(t => t.entries).filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);

    const categoryBalances = categories.map(category => {
      const categoryAccounts = accounts.filter(acc => acc.categoryId === category.id);
      const balance = categoryAccounts.reduce((catBalance, acc) => {
        const accountEntries = initialTransactions.flatMap(t => t.entries).filter(e => e.accountId === acc.id);
        const accountDebit = accountEntries.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);
        const accountCredit = accountEntries.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);
        
        if (acc.type === 'asset' || acc.type === 'expense') {
          return catBalance + accountDebit - accountCredit;
        }
        return catBalance + accountCredit - accountDebit;
      }, 0);
      return { ...category, balance };
    }).filter(cat => cat.balance !== 0);

    return {
      totalDebit,
      totalCredit,
      difference: totalDebit - totalCredit,
      categoryBalances,
    };
  }, [initialTransactions, accounts, categories]);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center gap-2">
              <ManageCategories categories={categories} />
              <Button onClick={() => setAddTxSheetOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-8">
          <StatCards stats={stats} />
          <RecentTransactions transactions={initialTransactions.slice(0, 5)} accounts={accounts} />
        </div>
      </main>

      <Sheet open={isAddTxSheetOpen} onOpenChange={setAddTxSheetOpen}>
        <SheetContent className="sm:max-w-2xl w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-headline text-2xl">Add New Transaction</SheetTitle>
            <SheetDescription>
              Record a new financial transaction. Ensure debits and credits are balanced.
            </SheetDescription>
          </SheetHeader>
          <AddTransactionForm accounts={accounts} onFinished={() => setAddTxSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
