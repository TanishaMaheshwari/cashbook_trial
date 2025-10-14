'use client';

import type { Account, Transaction } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import { Pencil, Trash2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"
import { useTransition } from 'react';
import { deleteTransactionAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';


type RecentTransactionsProps = {
  transactions: Transaction[];
  accounts: Account[];
};

export default function RecentTransactions({ transactions, accounts }: RecentTransactionsProps) {
  const getAccountName = (accountId: string) => accounts.find(a => a.id === accountId)?.name || 'Unknown Account';
  const pathname = usePathname();
  const isTransactionsPage = pathname === '/transactions';

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = (transactionId: string) => {
    startTransition(async () => {
      const result = await deleteTransactionAction(transactionId);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    });
  };

  const handleEdit = (transaction: Transaction) => {
    // For now, we'll just log this. In a real app, you'd open an edit form.
    console.log('Editing transaction:', transaction);
    toast({
      title: "Edit Not Implemented",
      description: "The edit functionality is not yet available.",
    });
  };


  return (
    <Card>
      <CardHeader>
         <CardTitle>{isTransactionsPage ? "All Transactions" : "Recent Transactions"}</CardTitle>
        {!isTransactionsPage && <CardDescription>A quick look at your latest financial activities.</CardDescription>}
      </CardHeader>
      <CardContent>
      {transactions.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">No transactions yet.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              {isTransactionsPage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map(tx => (
              <TableRow key={tx.id}>
                <TableCell className="w-28">{new Date(tx.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="font-medium">{tx.description}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-chart-2 font-semibold">To:</span> {tx.entries.filter(e => e.type === 'debit').map(e => getAccountName(e.accountId)).join(', ')}
                    <span className="text-chart-3 font-semibold mx-2">From:</span> {tx.entries.filter(e => e.type === 'credit').map(e => getAccountName(e.accountId)).join(', ')}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(tx.entries.find(e => e.type === 'debit')?.amount || 0)}</TableCell>
                 {isTransactionsPage && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(tx)}>
                        <Pencil className="h-4 w-4" />
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
                              This action cannot be undone. This will permanently delete this transaction.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(tx.id)}
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
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      </CardContent>
    </Card>
  );
}