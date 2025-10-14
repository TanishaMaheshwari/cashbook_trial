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
import { ArrowLeft, Edit, PlusCircle, Trash2, TrendingDown, TrendingUp, ArrowUpDown, MoreVertical, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Account, Category } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTransition, useState, useMemo } from 'react';
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
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

type AccountWithBalance = Account & { balance: number };

type AccountsClientProps = {
  initialAccounts: AccountWithBalance[];
  categories: Category[];
  totals: {
    debit: number;
    credit: number;
  };
};

export default function AccountsClient({ initialAccounts, categories, totals }: AccountsClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  const filteredAndSortedAccounts = useMemo(() => {
    let accounts = [...initialAccounts];

    if (searchTerm) {
      accounts = accounts.filter(account =>
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryName(account.categoryId).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    accounts.sort((a, b) => {
      let aValue, bValue;
      
      switch(sortField) {
        case 'category':
          aValue = getCategoryName(a.categoryId);
          bValue = getCategoryName(b.categoryId);
          break;
        case 'balance':
          aValue = a.balance;
          bValue = b.balance;
          break;
        default: // name or type
          aValue = a[sortField as keyof Account];
          bValue = b[sortField as keyof Account];
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return accounts;
  }, [initialAccounts, searchTerm, sortField, sortDirection, categories]);


  const handleSort = (field: string) => {
    if(sortField === field) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
        setSortField(field);
        setSortDirection('asc');
    }
  }

  const accountTypeColors: { [key: string]: string } = {
    asset: 'bg-green-100 text-green-800',
    liability: 'bg-red-100 text-red-800',
    equity: 'bg-purple-100 text-purple-800',
    revenue: 'bg-blue-100 text-blue-800',
    expense: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-headline">Accounts</h1>
        <div className="flex items-center gap-2">
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
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-grow md:flex-grow-0">
                <Input
                  placeholder="Search accounts by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full md:w-64 lg:w-80"
                />
            </div>
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 text-sm">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <label className="text-muted-foreground">Filter:</label>
                    <Select defaultValue="all">
                        <SelectTrigger className="w-[120px] h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Accounts</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="flex items-center gap-2 text-sm">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <label className="text-muted-foreground">Sort by:</label>
                    <Select value={sortField} onValueChange={setSortField}>
                        <SelectTrigger className="w-[100px] h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="balance">Balance</SelectItem>
                            <SelectItem value="type">Type</SelectItem>
                            <SelectItem value="category">Category</SelectItem>
                        </SelectContent>
                    </Select>
                     <Button variant="ghost" size="icon" onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}>
                        {sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                     </Button>
                 </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">All Accounts ({filteredAndSortedAccounts.length} of {initialAccounts.length})</CardTitle>
            <div className="text-sm font-mono">
                <span className="text-green-600 mr-4">Total Dr: {formatCurrency(totals.debit)}</span>
                <span className="text-red-600">Total Cr: {formatCurrency(totals.credit)}</span>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <div className="space-y-2 p-4">
            {filteredAndSortedAccounts.map((account) => (
                <Card key={account.id} className="grid grid-cols-6 gap-4 items-center p-3 hover:bg-muted/50 transition-colors">
                    <div className="col-span-2">
                        <Link href={`/accounts/${account.id}`} className="hover:underline">
                            <p className="font-semibold text-primary">{account.name}</p>
                        </Link>
                        <Badge variant="secondary" className={cn(accountTypeColors[account.type] || 'bg-gray-100 text-gray-800', 'capitalize text-xs')}>
                          {getCategoryName(account.categoryId)}
                        </Badge>
                    </div>
                    <div className="col-span-1 text-center font-mono">
                        {isDebitAccount(account.type) && account.balance !== 0 ? (
                           <>
                             <p className="text-green-600 font-semibold">{formatCurrency(account.balance)}</p>
                             <p className="text-xs text-muted-foreground">Dr Balance</p>
                           </>
                        ) : '-'}
                    </div>
                    <div className="col-span-1 text-center font-mono">
                        {!isDebitAccount(account.type) && account.balance !== 0 ? (
                           <>
                            <p className="text-red-600 font-semibold">{formatCurrency(account.balance)}</p>
                            <p className="text-xs text-muted-foreground">Cr Balance</p>
                           </>
                        ) : '-'}
                    </div>
                    <div className="col-span-1 text-center font-mono">
                      {account.balance === 0 && (
                        <>
                          <p className="font-semibold">{formatCurrency(0)}</p>
                          <p className="text-xs text-muted-foreground">{isDebitAccount(account.type) ? 'Dr Balance' : 'Cr Balance'}</p>
                        </>
                      )}
                    </div>
                    <div className="col-span-1 flex justify-end">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(account)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Edit</span>
                                </DropdownMenuItem>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                            <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                                            <span className="text-destructive">Delete</span>
                                        </DropdownMenuItem>
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
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </Card>
            ))}
             {filteredAndSortedAccounts.length === 0 && (
                 <div className="text-center py-10 text-muted-foreground">
                    No accounts found.
                 </div>
             )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
