'use client';

import type { Account, Transaction } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '../ui/separator';
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
import { useTransition, useState } from 'react';
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
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);


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
    <div>
      {!isTransactionsPage && <h2 className="text-2xl font-headline mb-4">Recent Transactions</h2>}
      {transactions.length === 0 ? (
        <Card className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">No transactions yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map(tx => (
            <Card key={tx.id} className="transition-all hover:shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-body font-bold text-lg">{tx.description}</CardTitle>
                    <CardDescription>{new Date(tx.date).toLocaleDateString()}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{formatCurrency(tx.entries.find(e => e.type === 'debit')?.amount || 0)}</Badge>
                     {isTransactionsPage && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-chart-2">To</h4>
                    <Separator className="mb-2 bg-chart-2/20" />
                    <ul className="space-y-1 text-sm">
                      {tx.entries.filter(e => e.type === 'debit').map((entry, i) => (
                        <li key={i} className="flex justify-between">
                          <span>{getAccountName(entry.accountId)}</span>
                          <span>{formatCurrency(entry.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-chart-3">From</h4>
                    <Separator className="mb-2 bg-chart-3/20"/>
                    <ul className="space-y-1 text-sm">
                      {tx.entries.filter(e => e.type === 'credit').map((entry, i) => (
                        <li key={i} className="flex justify-between">
                          <span>{getAccountName(entry.accountId)}</span>
                          <span>{formatCurrency(entry.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
