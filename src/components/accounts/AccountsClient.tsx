'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Edit, PlusCircle, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Account, Category } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTransition, useState } from 'react';
import { deleteAccountAction } from '@/app/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import AddAccountForm from './AddAccountForm';

type AccountWithBalance = Account & { balance: number };

type AccountsClientProps = {
  initialAccounts: AccountWithBalance[];
  categories: Category[];
  totals: {
    debit: number;
    credit: number;
  };
};

const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string; value: string; icon: React.ElementType; colorClass?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${colorClass || 'text-muted-foreground'}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export default function AccountsClient({ initialAccounts, categories, totals }: AccountsClientProps) {
  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'N/A';
  };
  
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isAddSheetOpen, setAddSheetOpen] = useState(false);

  const handleDelete = (accountId: string) => {
    startTransition(async () => {
      const result = await deleteAccountAction(accountId);
      if (result.success) {
        toast({ title: "Success", description: result.message });
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleEdit = (account: Account) => {
    toast({
      title: "Edit Not Implemented",
      description: "The edit functionality is not yet available.",
    });
    console.log("Editing account:", account);
  };
  
  const isDebitAccount = (type: Account['type']) => ['asset', 'expense'].includes(type);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft />
              <span className="sr-only">Back to Dashboard</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-headline">All Accounts</h1>
        </div>
        <Dialog open={isAddSheetOpen} onOpenChange={setAddSheetOpen}>
          <DialogTrigger asChild>
             <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">Add New Account</DialogTitle>
            </DialogHeader>
            <AddAccountForm categories={categories} onFinished={() => setAddSheetOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <StatCard title="Total Debits" value={formatCurrency(totals.debit)} icon={TrendingUp} colorClass="text-blue-500" />
        <StatCard title="Total Credits" value={formatCurrency(totals.credit)} icon={TrendingDown} colorClass="text-green-500" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chart of Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>{getCategoryName(account.categoryId)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">{account.type}</Badge>
                  </TableCell>
                  <TableCell className={cn(
                      "text-right font-mono",
                      isDebitAccount(account.type) ? "text-blue-600" : "text-green-600"
                    )}>
                      {formatCurrency(account.balance)}
                      <span className="text-xs text-muted-foreground ml-1">{isDebitAccount(account.type) ? 'Dr' : 'Cr'}</span>
                  </TableCell>
                  <TableCell>
                     <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this account.
                                You cannot delete an account that has transactions.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(account.id)}
                                disabled={isPending}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                {isPending ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
