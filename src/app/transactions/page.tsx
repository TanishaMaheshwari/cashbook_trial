import { getTransactions, getAccounts } from '@/lib/data';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function AllTransactionsPage() {
  const transactions = await getTransactions();
  const accounts = await getAccounts();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft />
            <span className="sr-only">Back to Dashboard</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-headline">All Transactions</h1>
      </div>
      <RecentTransactions transactions={transactions} accounts={accounts} />
    </div>
  );
}
