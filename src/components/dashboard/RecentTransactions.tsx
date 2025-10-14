'use client';

import type { Account, Category, Transaction } from '@/lib/types';
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
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { ArrowUpDown, Pencil, Trash2, ArrowRight, PlusCircle, MoreVertical, Calendar as CalendarIcon } from 'lucide-react';
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
import { deleteTransactionAction, updateTransactionHighlightAction, restoreItemAction, deletePermanentlyAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AddTransactionForm from '@/components/transactions/AddTransactionForm';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { DateRange } from 'react-day-picker';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useBooks } from '@/context/BookContext';


type RecentTransactionsProps = {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
};

type TransactionView = 'to_from' | 'dr_cr';
type HighlightColor = 'yellow' | 'blue' | 'green';
type DateRangePreset = 'all' | 'this_week' | 'this_month' | 'last_30_days' | 'last_90_days' | 'custom';

const highlightClasses: Record<HighlightColor, string> = {
  yellow: 'bg-yellow-100/70 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/40',
  blue: 'bg-blue-100/70 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40',
  green: 'bg-green-100/70 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/40',
};

export default function RecentTransactions({ transactions: initialTransactions, accounts, categories }: RecentTransactionsProps) {
  const getAccountName = (accountId: string) => accounts.find(a => a.id === accountId)?.name || 'Unknown Account';
  const pathname = usePathname();
  const isTransactionsPage = pathname === '/transactions';

  const [isPending, startTransition] = useTransition();
  const [isHighlightPending, startHighlightTransition] = useTransition();
  const { toast } = useToast();
  const { activeBook } = useBooks();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortDescriptor, setSortDescriptor] = useState('date-desc');

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const [transactionView, setTransactionView] = useState<TransactionView>('to_from');
  const [isMounted, setIsMounted] = useState(false);

  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    if (activeBook) {
      const storedView = localStorage.getItem(`transactionView_${activeBook.id}`) as TransactionView | null;
      if (storedView) {
        setTransactionView(storedView);
      }
    }
    setIsMounted(true);
  }, [activeBook]);

  const handleDelete = (transactionId: string) => {
    if (!activeBook) return;
    startTransition(async () => {
      const result = await deleteTransactionAction(activeBook.id, transactionId);
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
    if (!activeBook) return;
    startHighlightTransition(async () => {
      const newHighlight = currentColor === color ? null : color;
      const result = await updateTransactionHighlightAction(activeBook.id, transactionId, newHighlight);
      if (!result.success && result.message) {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    });
  };
  
  const handleDatePresetChange = (value: DateRangePreset) => {
    setDateRangePreset(value);
    if (value !== 'custom') {
      setCustomDateRange(undefined);
    }
  }

  const transactions = useMemo(() => {
    let filtered = [...initialTransactions];

    if (isTransactionsPage) {
        if (searchTerm) {
          filtered = filtered.filter(tx => tx.description.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        let dateFilterRange: DateRange | undefined = customDateRange;
        if (dateRangePreset !== 'custom' && dateRangePreset !== 'all') {
            const today = new Date();
            switch (dateRangePreset) {
                case 'this_week':
                    dateFilterRange = { from: startOfWeek(today), to: endOfWeek(today) };
                    break;
                case 'this_month':
                    dateFilterRange = { from: startOfMonth(today), to: endOfMonth(today) };
                    break;
                case 'last_30_days':
                    dateFilterRange = { from: subDays(today, 30), to: today };
                    break;
                case 'last_90_days':
                    dateFilterRange = { from: subDays(today, 90), to: today };
                    break;
            }
        }
        
        if (dateFilterRange?.from) {
             const from = dateFilterRange.from;
             const to = dateFilterRange.to || dateFilterRange.from; // if `to` is not set, use `from`
             
             filtered = filtered.filter(tx => {
                 const txDate = new Date(tx.date);
                 return txDate >= from && txDate <= to;
             });
        }
    }
    
    const [sortField, sortDirection] = sortDescriptor.split('-') as ['date' | 'amount' | 'description', 'asc' | 'desc'];

    const sorted = filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        aValue = a.entries.find(e => e.type === 'debit')?.amount || 0;
        bValue = b.entries.find(e => e.type === 'debit')?.amount || 0;
      } else { // description
        aValue = a.description;
        bValue = b.description;
      }
      
      if (typeof aValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    if (!isTransactionsPage) {
        return sorted.slice(0, 5);
    }
    return sorted;
  }, [initialTransactions, isTransactionsPage, searchTerm, sortDescriptor, dateRangePreset, customDateRange]);

  if (!isMounted) {
    return <Card><CardHeader><CardTitle>{isTransactionsPage ? "All Transactions" : "Recent Transactions"}</CardTitle></CardHeader><CardContent><p>Loading...</p></CardContent></Card>;
  }


  return (
    <>
    <Card>
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <CardTitle>{isTransactionsPage ? `All Transactions (${transactions.length})` : "Recent Transactions"}</CardTitle>
          {!isTransactionsPage && <CardDescription>A quick look at your latest financial activities.</CardDescription>}
        </div>
        {isTransactionsPage && (
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
            <Input
              placeholder="Filter by description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-auto"
            />
            <div className="flex items-center gap-2">
                <Select value={sortDescriptor} onValueChange={setSortDescriptor}>
                <SelectTrigger className="w-full flex-1 md:w-[180px]">
                    <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="date-desc">Most Recent</SelectItem>
                    <SelectItem value="date-asc">Oldest First</SelectItem>
                    <SelectItem value="amount-desc">Highest Amount</SelectItem>
                    <SelectItem value="amount-asc">Lowest Amount</SelectItem>
                    <SelectItem value="description-asc">Narration (A-Z)</SelectItem>
                </SelectContent>
                </Select>
                <Select value={dateRangePreset} onValueChange={handleDatePresetChange}>
                <SelectTrigger className="w-full flex-1 md:w-[180px]">
                    <SelectValue placeholder="Select a date range" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="this_week">This Week</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                    <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
                </Select>
            </div>
            {dateRangePreset === 'custom' && (
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-full md:w-[300px] justify-start text-left font-normal",
                        !customDateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateRange?.from ? (
                        customDateRange.to ? (
                            <>
                            {format(customDateRange.from, "LLL dd, y")} -{" "}
                            {format(customDateRange.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(customDateRange.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Pick a date</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={customDateRange?.from}
                        selected={customDateRange}
                        onSelect={setCustomDateRange}
                        numberOfMonths={2}
                    />
                    </PopoverContent>
                </Popover>
            )}
             <Button onClick={handleAdd} className="w-full md:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Transaction
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
      {transactions.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">No transactions match your criteria.</p>
        </div>
      ) : (
        <>
         {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {transactions.map(tx => (
              <Card key={tx.id} className={cn('w-full', tx.highlight && highlightClasses[tx.highlight])}>
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{tx.description}</p>
                      <p className="text-sm text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                    <p className="font-semibold text-lg">{formatCurrency(tx.entries.find(e => e.type === 'debit')?.amount || 0)}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p><span className="text-green-600 font-semibold">{transactionView === 'dr_cr' ? 'Dr:' : 'To:'}</span> {tx.entries.filter(e => e.type === 'debit').map(e => getAccountName(e.accountId)).join(', ')}</p>
                    <p><span className="text-red-600 font-semibold">{transactionView === 'dr_cr' ? 'Cr:' : 'From:'}</span> {tx.entries.filter(e => e.type === 'credit').map(e => getAccountName(e.accountId)).join(', ')}</p>
                  </div>
                  {isTransactionsPage && (
                    <div className="flex items-center justify-end gap-2 border-t pt-3 mt-2">
                       <Button variant="ghost" size="sm" onClick={() => handleEdit(tx)}><Pencil className="mr-2 h-4 w-4"/> Edit</Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>
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
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                     Date
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">
                        Amount
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
          </div>
        </>
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
              categories={categories}
              onFinished={onSheetFinished}
              initialData={editingTransaction}
            />
        </DialogContent>
    </Dialog>
    </>
  );
}
