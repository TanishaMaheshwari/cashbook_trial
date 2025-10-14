'use client';

import type { Account, Category, Transaction } from '@/lib/types';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Folder, PlusCircle, Settings } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import AddTransactionForm from '@/components/transactions/AddTransactionForm';
import StatCards from './StatCards';
import RecentTransactions from './RecentTransactions';
import Link from 'next/link';
import { List, Users } from 'lucide-react';
import CategoryAccounts from './CategoryAccounts';


type DashboardClientProps = {
  initialTransactions: Transaction[];
  accounts: Account[];
  categories: Category[];
};

export default function DashboardClient({ initialTransactions, accounts, categories }: DashboardClientProps) {
  const [isAddTxSheetOpen, setAddTxSheetOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(categories[0]?.id);

  const stats = useMemo(() => {
    const totalDebit = initialTransactions.flatMap(t => t.entries).filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);
    const totalCredit = initialTransactions.flatMap(t => t.entries).filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);

    let accountsInSelectedCategory;
    if (selectedCategoryId) {
        accountsInSelectedCategory = accounts
            .filter(acc => acc.categoryId === selectedCategoryId)
            .map(account => {
                const accountEntries = initialTransactions.flatMap(t => t.entries).filter(e => e.accountId === account.id);
                const totalDebit = accountEntries.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);
                const totalCredit = accountEntries.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);
                let balance = 0;
                if (account.type === 'asset' || account.type === 'expense') {
                    balance = totalDebit - totalCredit;
                } else {
                    balance = totalCredit - totalDebit;
                }
                return { ...account, balance };
            })
            .filter(acc => acc.balance !== 0);
    }

    return {
      totalDebit,
      totalCredit,
      difference: totalDebit - totalCredit,
      accountsInSelectedCategory,
    };
  }, [initialTransactions, accounts, categories, selectedCategoryId]);

  const selectedCategoryName = categories.find(c => c.id === selectedCategoryId)?.name;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center gap-2">
               <Button variant="outline" asChild>
                <Link href="/transactions">
                  <List className="mr-2 h-4 w-4" />
                  All Transactions
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/accounts">
                  <Users className="mr-2 h-4 w-4" />
                  All Accounts
                </Link>
              </Button>
               <Button variant="outline" asChild>
                <Link href="/categories">
                  <Folder className="mr-2 h-4 w-4" />
                  All Categories
                </Link>
              </Button>
               <Button variant="ghost" size="icon" asChild>
                <Link href="/settings">
                  <Settings />
                  <span className="sr-only">Settings</span>
                </Link>
              </Button>
              <Button onClick={() => setAddTxSheetOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:px-8">
        <div className="space-y-8">
          <StatCards 
            stats={stats}
          />
          
           {selectedCategoryName && stats.accountsInSelectedCategory && (
            <CategoryAccounts
                categoryName={selectedCategoryName}
                accounts={stats.accountsInSelectedCategory}
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onCategoryChange={setSelectedCategoryId}
            />
           )}
          
          <RecentTransactions transactions={initialTransactions} accounts={accounts} />
        </div>
      </main>

      <Dialog open={isAddTxSheetOpen} onOpenChange={setAddTxSheetOpen}>
        <DialogContent className="sm:max-w-3xl w-full overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">Add New Transaction</DialogTitle>
          </DialogHeader>
          <AddTransactionForm accounts={accounts} onFinished={() => setAddTxSheetOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
