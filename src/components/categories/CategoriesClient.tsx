'use client';

import type { Account, Category } from '@/lib/types';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreVertical, PlusCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, cn } from '@/lib/utils';
import Link from 'next/link';
import ManageCategories from '@/components/dashboard/ManageCategories';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { deleteCategoryAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useBooks } from '@/context/BookContext';

type AccountWithBalance = Account & { balance: number };
type CategoryWithDetails = Category & {
  accounts: AccountWithBalance[];
  totalBalance: number;
};

type CategoriesClientProps = {
  categories: CategoryWithDetails[];
  allCategories: Category[];
};

const categoryColors = [
  'bg-violet-100 border-violet-200',
  'bg-blue-100 border-blue-200',
  'bg-green-100 border-green-200',
  'bg-gray-100 border-gray-200',
  'bg-red-100 border-red-200',
  'bg-yellow-100 border-yellow-200',
];

export default function CategoriesClient({ categories, allCategories }: CategoriesClientProps) {
  const [openManageCategories, setOpenManageCategories] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { activeBook } = useBooks();

  const handleDelete = (categoryId: string) => {
    if (!activeBook) return;
    startTransition(async () => {
      const result = await deleteCategoryAction(activeBook.id, categoryId);
      if (result.success) {
        toast({ title: "Success", description: result.message });
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-headline">Categories</h1>
        <div className="flex items-center gap-2">
            <ManageCategories categories={allCategories} />
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category, index) => (
          <Card key={category.id} className={cn(categoryColors[index % categoryColors.length])}>
            <CardHeader className="flex flex-row justify-between items-start">
              <div>
                <CardTitle className="font-bold text-lg">{category.name}</CardTitle>
                <CardDescription className="text-sm">
                  {category.accounts.length} accounts &bull; Total: {formatCurrency(category.totalBalance)}
                </CardDescription>
              </div>
               <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled>
                            Edit Category
                        </DropdownMenuItem>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Category
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete this category. You cannot delete a category that has accounts assigned to it.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleDelete(category.id)}
                                        disabled={isPending}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        {isPending ? 'Deleting...' : 'Delete'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent>
              {category.accounts.length > 0 ? (
                <ul className="space-y-2">
                  {category.accounts.map((account) => (
                     <li key={account.id} className="flex justify-between items-center bg-background/50 p-3 rounded-md">
                        <Link href={`/accounts/${account.id}`} className="font-medium hover:underline">
                            {account.name}
                        </Link>
                        <span className="font-semibold text-green-700">
                            {formatCurrency(account.balance)}
                        </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No accounts in this category.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
