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
import { deleteAccountAction, deleteMultipleAccountsAction } from '@/app/actions';
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
import { Checkbox } from '../ui/checkbox';

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
  const [sortDescriptor, setSortDescriptor] = useState('name-asc');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

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
  
  const handleBulkDelete = () => {
    startTransition(async () => {
      const result = await deleteMultipleAccountsAction(selectedAccounts);
      if (result.success) {
        toast({ title: "Success", description: `${selectedAccounts.length} accounts deleted.` });
        setSelectedAccounts([]);
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
    
    const [sortField, sortDirection] = sortDescriptor.split('-') as ['name' | 'balance' | 'type' | 'category', 'asc' | 'desc'];


    accounts.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch(sortField) {
        case 'category':
          aValue = getCategoryName(a.categoryId);
          bValue = getCategoryName(b.categoryId);
          break;
        case 'balance':
          aValue = a.balance;
          bValue = b.balance;
          break;
        case 'type':
            aValue = a.type;
            bValue = b.type;
            break;
        default: // name
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return accounts;
  }, [initialAccounts, searchTerm, sortDescriptor, categories]);

  const handleSelect = (accountId: string, checked: boolean) => {
    if(checked) {
      setSelectedAccounts(prev => [...prev, accountId]);
    } else {
      setSelectedAccounts(prev => prev.filter(id => id !== accountId));
    }
  }
  
  const handleSelectAll = (checked: boolean) => {
    if(checked) {
      setSelectedAccounts(filteredAndSortedAccounts.map(a => a.id));
    } else {
      setSelectedAccounts([]);
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
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <label className="text-muted-foreground">Sort by:</label>
                    <Select value={sortDescriptor} onValueChange={setSortDescriptor}>
                        <SelectTrigger className="w-[180px] h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                            <SelectItem value="balance-desc">Balance (Highest First)</SelectItem>
                            <SelectItem value="balance-asc">Balance (Lowest First)</SelectItem>
                            <SelectItem value="type-asc">Type</SelectItem>
                            <SelectItem value="category-asc">Category</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
                {selectedAccounts.length > 0 ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected ({selectedAccounts.length})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete {selectedAccounts.length} accounts. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                          {isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                    <CardTitle className="text-lg">All Accounts ({filteredAndSortedAccounts.length} of {initialAccounts.length})</CardTitle>
                )}
            </div>
            <div className="text-sm">
                <span className="text-green-600 mr-4">Total Dr: {formatCurrency(totals.debit)}</span>
                <span className="text-red-600">Total Cr: {formatCurrency(totals.credit)}</span>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12">
                           <Checkbox 
                                checked={selectedAccounts.length === filteredAndSortedAccounts.length && filteredAndSortedAccounts.length > 0}
                                onCheckedChange={(checked) => handleSelectAll(!!checked)}
                           />
                        </TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredAndSortedAccounts.map((account) => (
                    <TableRow key={account.id} data-state={selectedAccounts.includes(account.id) ? 'selected' : undefined}>
                        <TableCell>
                           <Checkbox 
                                checked={selectedAccounts.includes(account.id)}
                                onCheckedChange={(checked) => handleSelect(account.id, !!checked)}
                           />
                        </TableCell>
                        <TableCell>
                           <Link href={`/accounts/${account.id}`} className="hover:underline">
                                <p className="font-semibold text-primary">{account.name}</p>
                            </Link>
                        </TableCell>
                        <TableCell>
                             <Badge variant="secondary" className={cn(accountTypeColors[account.type] || 'bg-gray-100 text-gray-800', 'capitalize text-xs')}>
                                {getCategoryName(account.categoryId)}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                             {isDebitAccount(account.type) ? (
                                <span className="text-green-600 font-semibold">{formatCurrency(account.balance)}</span>
                            ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                             {!isDebitAccount(account.type) ? (
                                <span className="text-red-600 font-semibold">{formatCurrency(account.balance)}</span>
                            ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
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
                        </TableCell>
                    </TableRow>
                ))}
                 {filteredAndSortedAccounts.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            No accounts found.
                        </TableCell>
                     </TableRow>
                 )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
