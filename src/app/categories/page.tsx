import { getAccounts, getCategories, getTransactions } from '@/lib/data';
import type { Account, Transaction, Category } from '@/lib/types';
import CategoriesClient from '@/components/categories/CategoriesClient';

type AccountWithBalance = Account & { balance: number };
type CategoryWithDetails = Category & {
  accounts: AccountWithBalance[];
  totalBalance: number;
};

export default async function CategoriesPage() {
  const [accounts, categories, transactions] = await Promise.all([
    getAccounts(),
    getCategories(),
    getTransactions(),
  ]);

  const categoriesWithDetails: CategoryWithDetails[] = categories.map((category) => {
    const accountsInCategory = accounts.filter((acc) => acc.categoryId === category.id);
    
    const accountsWithBalances = accountsInCategory.map((account) => {
      const accountEntries = transactions.flatMap((t) => t.entries).filter((e) => e.accountId === account.id);
      const totalDebit = accountEntries.filter((e) => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);
      const totalCredit = accountEntries.filter((e) => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);

      let balance = 0;
      if (account.type === 'asset' || account.type === 'expense') {
        balance = totalDebit - totalCredit;
      } else {
        balance = totalCredit - totalDebit;
      }

      return { ...account, balance };
    });

    const totalBalance = accountsWithBalances.reduce((sum, acc) => sum + acc.balance, 0);

    return {
      ...category,
      accounts: accountsWithBalances,
      totalBalance,
    };
  });

  return (
    <CategoriesClient 
        categories={categoriesWithDetails} 
        allCategories={categories}
    />
  );
}
