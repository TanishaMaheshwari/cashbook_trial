'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Account } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useBooks } from '@/context/BookContext';

type TransactionView = 'to_from' | 'dr_cr';

type LedgerEntry = {
  transactionId: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
};

type AccountLedgerClientProps = {
  account: Account;
  ledgerEntries: LedgerEntry[];
  finalBalance: number;
  categoryName: string;
};

export default function AccountLedgerClient({ account, ledgerEntries, finalBalance, categoryName }: AccountLedgerClientProps) {
  const [transactionView, setTransactionView] = useState<TransactionView>('to_from');
  const [isMounted, setIsMounted] = useState(false);
  const { activeBook } = useBooks();

  useEffect(() => {
    if (activeBook) {
      const storedView = localStorage.getItem(`transactionView_${activeBook.id}`) as TransactionView | null;
      if (storedView) {
        setTransactionView(storedView);
      }
    }
    setIsMounted(true);
  }, [activeBook]);


  const isDebitBalance = finalBalance >= 0;

  if (!isMounted) {
    return null; // Or a loading skeleton
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/accounts">
                <ArrowLeft />
                <span className="sr-only">Back to Accounts</span>
              </Link>
            </Button>
            <div>
                <h1 className="text-3xl font-headline">{account.name}</h1>
                <p className="text-muted-foreground">Account Ledger</p>
            </div>
          </div>
          <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
            <CardTitle className="text-lg">Account Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
                <p className="text-muted-foreground">Category</p>
                <p><Badge variant="secondary" className="capitalize">{categoryName}</Badge></p>
            </div>
             <div>
                <p className="text-muted-foreground">Final Balance</p>
                <p className="font-bold text-lg">
                    {formatCurrency(Math.abs(finalBalance))}
                    <span className="text-xs text-muted-foreground ml-1">{isDebitBalance ? 'Dr' : 'Cr'}</span>
                </p>
            </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>All transactions involving this account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgerEntries.map((entry, index) => (
                <TableRow key={`${entry.transactionId}-${index}`}>
                  <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                   <TableCell className="text-right text-green-600">
                    {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Math.abs(entry.balance))}
                     <span className="text-xs text-muted-foreground ml-1">{entry.balance >= 0 ? 'Dr' : 'Cr'}</span>
                  </TableCell>
                </TableRow>
              ))}
              {ledgerEntries.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">No transactions found for this account.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
