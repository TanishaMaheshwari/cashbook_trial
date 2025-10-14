'use client';

import type { Account, Transaction } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '../ui/separator';

type RecentTransactionsProps = {
  transactions: Transaction[];
  accounts: Account[];
};

export default function RecentTransactions({ transactions, accounts }: RecentTransactionsProps) {
  const getAccountName = (accountId: string) => accounts.find(a => a.id === accountId)?.name || 'Unknown Account';

  return (
    <div>
      <h2 className="text-2xl font-headline mb-4">Recent Transactions</h2>
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
                  <Badge variant="secondary">{formatCurrency(tx.entries.find(e => e.type === 'debit')?.amount || 0)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-chart-3">Debits</h4>
                    <Separator className="mb-2 bg-chart-3/20" />
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
                    <h4 className="font-semibold mb-2 text-chart-2">Credits</h4>
                    <Separator className="mb-2 bg-chart-2/20"/>
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
