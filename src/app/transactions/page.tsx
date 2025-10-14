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
      <div className="flex items-center justify-end gap-4 mb-6">
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <RecentTransactions transactions={transactions} accounts={accounts} />
    </div>
  );
}
