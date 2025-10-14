'use client';

import type { Account, Transaction } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import { ArrowUpDown, Pencil, Trash2, ArrowRight, PlusCircle, MoreVertical } from 'lucide-react';
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
import { useTransition, useState, useMemo, useEffect } from 'react';
import { deleteTransactionAction, updateTransactionHighlightAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AddTransactionForm from '@/components/transactions/AddTransactionForm';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

type RecentTransactionsProps = {
  transactions: Transaction[];
  accounts: Account[];
};

type TransactionView = 'to_from' | 'dr_cr';
type HighlightColor = 'yellow' | 'blue' | 'green';

const highlightClasses: Record<HighlightColor, string> = {
  yellow: 'bg-yellow-100/70 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/40',
  blue: 'bg-blue-100/70 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40',
  green: 'bg-green-100/70 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/40',
};

export default function RecentTransactions({ transactions: initialTransactions, accounts }: RecentTransactionsProps) {
  const getAccountName = (accountId: string) => accounts.find(a => a.id === accountId)?.name || 'Unknown Account';
  const pathname = usePathname();
  const isTransactionsPage = pathname === '/transactions';

  const [isPending, startTransition] = useTransition();
  const [isHighlightPending, startHighlightTransition] = useTransition();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const [transactionView, setTransactionView] = useState<TransactionView>('to_from');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const storedView = localStorage.getItem('transactionView') as TransactionView | null;
    if (storedView) {
      setTransactionView(storedView);
    }
    setIsMounted(true);
  }, []);

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
    setEditingTransaction(transaction);
    setIsSheetOpen(true);
  };

  const handleAdd = () => {
    setEditingTransaction(null);
    setIsSheetOpen(true);
  }
  
  const onSheetFinished = () => {
    setIsSheetOpen(false);
    setEditingTransaction(null);
  }

  const handleHighlight = (transactionId: string, color: HighlightColor, currentColor?: HighlightColor) => {
    startHighlightTransition(async () => {
      const newHighlight = currentColor === color ? null : color;
      const result = await updateTransactionHighlightAction(transactionId, newHighlight);
      if (!result.success && result.message) {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    });
  };

  const transactions = useMemo(() => {
    let filtered = [...initialTransactions];

    if (isTransactionsPage && searchTerm) {
      filtered = filtered.filter(tx => tx.description.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    const sorted = filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      } else { // amount
        aValue = a.entries.find(e => e.type === 'debit')?.amount || 0;
        bValue = b.entries.find(e => e.type === 'debit')?.amount || 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    if (!isTransactionsPage) {
        return sorted.slice(0, 5);
    }
    return sorted;
  }, [initialTransactions, isTransactionsPage, searchTerm, sortField, sortDirection]);

  const handleSort = (field: 'date' | 'amount') => {
    if(sortField === field) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
        setSortField(field);
        setSortDirection('desc');
    }
  }
  
  if (!isMounted) {
    return <Card><CardHeader><CardTitle>{isTransactionsPage ? "All Transactions" : "Recent Transactions"}</CardTitle></CardHeader><CardContent><p>Loading...</p></CardContent></Card>;
  }


  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{isTransactionsPage ? "All Transactions" : "Recent Transactions"}</CardTitle>
          {isTransactionsPage ? (
            <div className="flex items-center gap-4 pt-4">
              <Input
                placeholder="Filter by description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          ) : <CardDescription>A quick look at your latest financial activities.</CardDescription>}
        </div>
        {isTransactionsPage && (
          <Button onClick={handleAdd}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        )}
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
              <TableHead>
                 <Button variant="ghost" onClick={() => handleSort('date')}>
                    Date <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort('amount')}>
                    Amount <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
              </TableHead>
              {isTransactionsPage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map(tx => (
              <TableRow key={tx.id} className={cn(tx.highlight && highlightClasses[tx.highlight])}>
                <TableCell className="w-28">{new Date(tx.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="font-medium">{tx.description}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-green-600 font-semibold">{transactionView === 'dr_cr' ? 'Dr:' : 'To:'}</span> {tx.entries.filter(e => e.type === 'debit').map(e => getAccountName(e.accountId)).join(', ')}
                    <span className="text-red-600 font-semibold mx-2">{transactionView === 'dr_cr' ? 'Cr:' : 'From:'}</span> {tx.entries.filter(e => e.type === 'credit').map(e => getAccountName(e.accountId)).join(', ')}
                  </div>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(tx.entries.find(e => e.type === 'debit')?.amount || 0)}</TableCell>
                 {isTransactionsPage && (
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-1 border border-yellow-400 bg-yellow-200/50 hover:bg-yellow-200/80 text-yellow-700 data-[active=true]:bg-yellow-300"
                        data-active={tx.highlight === 'yellow'}
                        onClick={() => handleHighlight(tx.id, 'yellow', tx.highlight)}
                        disabled={isHighlightPending}
                      >
                        <span className='font-bold text-xs'>1</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-1 border border-blue-400 bg-blue-200/50 hover:bg-blue-200/80 text-blue-700 data-[active=true]:bg-blue-300"
                        data-active={tx.highlight === 'blue'}
                        onClick={() => handleHighlight(tx.id, 'blue', tx.highlight)}
                        disabled={isHighlightPending}
                      >
                        <span className='font-bold text-xs'>2</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-1 border border-green-400 bg-green-200/50 hover:bg-green-200/80 text-green-700 data-[active=true]:bg-green-300"
                        data-active={tx.highlight === 'green'}
                        onClick={() => handleHighlight(tx.id, 'green', tx.highlight)}
                        disabled={isHighlightPending}
                      >
                        <span className='font-bold text-xs'>3</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">More actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => handleEdit(tx)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      <span>Delete</span>
                                  </DropdownMenuItem>
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      </CardContent>
       {!isTransactionsPage && transactions.length > 0 && (
        <CardFooter className="justify-center border-t p-4">
            <Button asChild variant="ghost" size="sm">
                <Link href="/transactions">
                View All Transactions <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardFooter>
      )}
    </Card>

    <Dialog open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <DialogContent className="sm:max-w-3xl w-full overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
          </DialogHeader>
            <AddTransactionForm
              accounts={accounts}
              onFinished={onSheetFinished}
              initialData={editingTransaction}
            />
        </DialogContent>
    </Dialog>
    </>
  );
}
