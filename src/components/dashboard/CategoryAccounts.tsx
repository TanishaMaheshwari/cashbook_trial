'use client';

import type { Account } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
        <CardDescription>Breakdown of accounts in the selected category.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>
                  <Link href={`/accounts/${account.id}`} className="font-medium text-primary hover:underline">
                    {account.name}
                  </Link>
                </TableCell>
                <TableCell>
                   <Badge variant="secondary" className={cn(accountTypeColors[account.type] || 'bg-gray-100 text-gray-800', 'capitalize text-xs')}>
                    {account.type}
                  </Badge>
                </TableCell>
                <TableCell className={cn(
                    "text-right font-mono",
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
    </Card>
  );
}
