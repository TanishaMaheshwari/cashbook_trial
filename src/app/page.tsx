import { getAccounts, getCategories, getTransactions } from '@/lib/data';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { cookies } from 'next/headers';

export default async function Home() {
  const activeBookId = cookies().get('activeBookId')?.value || 'book_default';

  const [initialTransactions, accounts, categories] = await Promise.all([
    getTransactions(activeBookId),
    getAccounts(activeBookId),
    getCategories(activeBookId),
  ]);

  return (
    <DashboardClient
      initialTransactions={initialTransactions}
      accounts={accounts}
      categories={categories}
    />
  );
}
