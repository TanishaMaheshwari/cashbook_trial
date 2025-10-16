
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
import { ArrowLeft, Share, FileImage, FileText, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Account } from '@/lib/types';
import { formatCurrency, cn, formatDate } from '@/lib/utils';
import { useState, useEffect, useMemo, useRef, useTransition } from 'react';
import { useBooks } from '@/context/BookContext';
import Header from '../layout/Header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  allLedgerEntries: LedgerEntry[];
  categoryName: string;
  normallyDebit: boolean;
};

export default function AccountLedgerClient({ account, allLedgerEntries, categoryName, normallyDebit }: AccountLedgerClientProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { activeBook } = useBooks();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const ledgerRef = useRef<HTMLDivElement>(null);
  const [isSharing, startSharingTransition] = useTransition();


  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { displayEntries, finalBalance, openingBalance } = useMemo(() => {
    let runningBalance = 0;
    
    // Calculate opening balance: sum of all transactions *before* the start date
    const openingEntries = dateRange?.from 
      ? allLedgerEntries.filter(entry => new Date(entry.date) < new Date(dateRange.from!))
      : [];
      
    let ob = 0;
    if (openingEntries.length > 0) {
        ob = openingEntries[openingEntries.length - 1].balance;
    }
    runningBalance = ob;

    // Filter entries based on the date range
    const filteredEntries = allLedgerEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      if (dateRange?.from && entryDate < new Date(dateRange.from)) return false;
      if (dateRange?.to && entryDate > new Date(dateRange.to)) return false;
      return true;
    });

    // Recalculate running balance for the filtered period
    const ledgerForDisplay = filteredEntries.map(tx => {
      const debit = tx.debit;
      const credit = tx.credit;

      if (normallyDebit) {
          runningBalance += debit - credit;
      } else {
          runningBalance += credit - debit;
      }
      
      return {
        ...tx,
        balance: runningBalance,
      };
    });

    return {
      displayEntries: ledgerForDisplay.slice().reverse(), // Most recent first
      finalBalance: runningBalance,
      openingBalance: ob,
    };
  }, [allLedgerEntries, dateRange, normallyDebit]);

  const handleShare = (format: 'pdf' | 'image') => {
    startSharingTransition(async () => {
        if (!ledgerRef.current) return;

        const canvas = await html2canvas(ledgerRef.current, {
            scale: 2,
            useCORS: true,
        });

        if (format === 'image') {
            const imgData = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${account.name}_Ledger.png`;
            link.href = imgData;
            link.click();
        } else if (format === 'pdf') {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            // Add title
            pdf.setFontSize(20);
            pdf.text(`${account.name} - Ledger`, pdfWidth / 2, 40, { align: 'center' });
            if (activeBook) {
              pdf.setFontSize(14);
              pdf.text(activeBook.name, pdfWidth / 2, 60, { align: 'center' });
            }

            pdf.addImage(imgData, 'PNG', 0, 80, canvas.width, canvas.height);
            pdf.save(`${account.name}_Ledger.pdf`);
        }
    });
  }


  if (!isMounted) {
    return null; // Or a loading skeleton
  }
  
  const isFinalBalanceDebit = normallyDebit ? finalBalance >= 0 : finalBalance < 0;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <Header backHref="/accounts" />
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
                <h1 className="text-3xl font-headline">{account.name}</h1>
                <p className="text-muted-foreground">Account Ledger</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date" variant="outline" className={cn("w-[260px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>{format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}</>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
              </PopoverContent>
            </Popover>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isSharing}>
                        {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share className="mr-2 h-4 w-4" />}
                        {isSharing ? 'Generating...' : 'Share'}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleShare('pdf')} disabled={isSharing}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Share as PDF</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('image')} disabled={isSharing}>
                        <FileImage className="mr-2 h-4 w-4" />
                        <span>Share as Image</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
      </div>
      
      <div ref={ledgerRef} className="bg-background p-4 rounded-lg">
        <div className="grid md:grid-cols-3 gap-6 text-sm mb-6">
          <Card>
              <CardHeader className="pb-2">
                  <CardDescription>Category</CardDescription>
                  <CardTitle className="text-base"><Badge variant="secondary" className="capitalize">{categoryName}</Badge></CardTitle>
              </CardHeader>
          </Card>
           <Card>
              <CardHeader className="pb-2">
                  <CardDescription>Opening Balance</CardDescription>
                  <CardTitle className="text-base">
                      {formatCurrency(Math.abs(openingBalance))}
                      <span className="text-xs text-muted-foreground ml-1">{normallyDebit ? (openingBalance >= 0 ? 'Dr' : 'Cr') : (openingBalance >= 0 ? 'Cr' : 'Dr')}</span>
                  </CardTitle>
              </CardHeader>
          </Card>
           <Card>
              <CardHeader className="pb-2">
                  <CardDescription>Balance as of {dateRange?.to ? formatDate(dateRange.to) : 'Today'}</CardDescription>
                  <CardTitle className="text-base font-bold">
                      {formatCurrency(Math.abs(finalBalance))}
                      <span className="text-xs text-muted-foreground ml-1">{isFinalBalanceDebit ? 'Dr' : 'Cr'}</span>
                  </CardTitle>
              </CardHeader>
          </Card>
        </div>


        <Card>
          <CardHeader>
            <CardTitle>Ledger Entries</CardTitle>
            <CardDescription>Transactions for the selected period.</CardDescription>
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
                <TableRow>
                  <TableCell colSpan={4} className="font-bold">Opening Balance</TableCell>
                  <TableCell className="text-right font-bold">
                     {formatCurrency(Math.abs(openingBalance))}
                     <span className="text-xs text-muted-foreground ml-1">{normallyDebit ? (openingBalance >= 0 ? 'Dr' : 'Cr') : (openingBalance >= 0 ? 'Cr' : 'Dr')}</span>
                  </TableCell>
                </TableRow>

                {displayEntries.slice().reverse().map((entry, index) => (
                  <TableRow key={`${entry.transactionId}-${index}`}>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                     <TableCell className="text-right text-green-600">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Math.abs(entry.balance))}
                       <span className="text-xs text-muted-foreground ml-1">{normallyDebit ? (entry.balance >= 0 ? 'Dr' : 'Cr') : (entry.balance >= 0 ? 'Cr' : 'Dr')}</span>
                    </TableCell>
                  </TableRow>
                ))}
                {displayEntries.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">No transactions found in this period.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
