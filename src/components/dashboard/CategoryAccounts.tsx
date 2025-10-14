'use client';

import type { Account } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

type AccountWithBalance = Account & { balance: number };

type CategoryAccountsProps = {
  categoryName: string;
  accounts: AccountWithBalance[];
};

export default function CategoryAccounts({ categoryName, accounts }: CategoryAccountsProps) {
  const isDebitAccount = (type: Account['type']) => ['asset', 'expense'].includes(type);

  if (!accounts || accounts.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{categoryName} Accounts</CardTitle>
                <CardDescription>No accounts with balances found in this category.</CardDescription>
            </CardHeader>
        </Card>
    );
  }
  
  const totalDebit = accounts.filter(a => isDebitAccount(a.type)).reduce((sum, a) => sum + a.balance, 0);
  const totalCredit = accounts.filter(a => !isDebitAccount(a.type)).reduce((sum, a) => sum + a.balance, 0);


  const accountTypeColors: { [key: string]: string } = {
    asset: 'bg-green-100 text-green-800',
    liability: 'bg-red-100 text-red-800',
    equity: 'bg-purple-100 text-purple-800',
    revenue: 'bg-blue-100 text-blue-800',
    expense: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{categoryName} Accounts</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-auto py-2">Account Name</TableHead>
              <TableHead className="h-auto py-2">Type</TableHead>
              <TableHead className="text-right h-auto py-2">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="py-2">
                  <Link href={`/accounts/${account.id}`} className="font-medium text-primary hover:underline">
                    {account.name}
                  </Link>
                </TableCell>
                <TableCell className="py-2">
                   <Badge variant="secondary" className={cn(accountTypeColors[account.type] || 'bg-gray-100 text-gray-800', 'capitalize text-xs')}>
                    {account.type}
                  </Badge>
                </TableCell>
                <TableCell className={cn(
                    "text-right py-2",
                    isDebitAccount(account.type) ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(account.balance)}
                  <span className="text-xs text-muted-foreground ml-1">{isDebitAccount(account.type) ? 'Dr' : 'Cr'}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="justify-end gap-4 text-sm border-t pt-4">
        <div className="font-semibold">
            <span className="text-muted-foreground mr-2">Total Debit:</span>
            <span className="text-green-600">{formatCurrency(totalDebit)}</span>
        </div>
        <div className="font-semibold">
            <span className="text-muted-foreground mr-2">Total Credit:</span>
            <span className="text-red-600">{formatCurrency(totalCredit)}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
