import { getAccounts, getCategories, getTransactions } from '@/lib/data';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function Home() {
  const [initialTransactions, accounts, categories] = await Promise.all([
    getTransactions(),
    getAccounts(),
    getCategories(),
  ]);

  return (
    <DashboardClient
      initialTransactions={initialTransactions}
      accounts={accounts}
      categories={categories}
    />
  );
}
