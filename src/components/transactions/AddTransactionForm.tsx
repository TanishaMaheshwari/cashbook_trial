'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, MinusCircle, PlusCircle, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn, formatCurrency } from '@/lib/utils';
import type { Account, Category } from '@/lib/types';
import { useTransition, useMemo, useState } from 'react';
import { createTransactionAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AddAccountForm from '@/components/accounts/AddAccountForm';


const transactionEntrySchema = z.object({
  accountId: z.string().min(1, 'Account is required.'),
  type: z.enum(['debit', 'credit']),
  amount: z.coerce.number().positive('Amount must be positive.'),
});

const formSchema = z.object({
  description: z.string().min(3, 'Description must be at least 3 characters.').max(100),
  date: z.date({ required_error: 'Date is required.' }),
  entries: z.array(transactionEntrySchema).min(2, 'At least one debit and one credit entry are required.'),
})
.refine(
  (data) => {
    const totalDebits = data.entries.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);
    const totalCredits = data.entries.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);
    return Math.abs(totalDebits - totalCredits) < 0.01;
  },
  {
    message: 'Total "To" amounts must equal total "From" amounts.',
    path: ['entries'],
  }
);

type AddTransactionFormProps = {
  accounts: Account[];
  onFinished: () => void;
};

export default function AddTransactionForm({ accounts, onFinished }: AddTransactionFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isAddAccountOpen, setAddAccountOpen] = useState(false);

  // We need categories for the AddAccountForm, but they are not passed in.
  // This is a limitation for now. We will pass a dummy array.
  // A better solution would be to fetch categories here or pass them down.
  const dummyCategories: Category[] = [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      date: new Date(),
      entries: [
        { accountId: '', type: 'debit', amount: 0 },
        { accountId: '', type: 'credit', amount: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'entries',
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      const result = await createTransactionAction(values);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        onFinished();
        form.reset();
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    });
  };

  const watchedEntries = form.watch('entries');
  const { totalDebits, totalCredits } = useMemo(() => {
    const debits = watchedEntries.filter(e => e.type === 'debit').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const credits = watchedEntries.filter(e => e.type === 'credit').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { totalDebits: debits, totalCredits: credits };
  }, [watchedEntries]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Transaction Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Office supplies purchase" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium font-headline">Entries</h3>
             <Dialog open={isAddAccountOpen} onOpenChange={setAddAccountOpen}>
              <DialogTrigger asChild>
                 <Button variant="outline" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-headline text-2xl">Add New Account</DialogTitle>
                </DialogHeader>
                {/* Passing dummyCategories. A proper implementation would need access to real categories. */}
                <AddAccountForm categories={dummyCategories} onFinished={() => setAddAccountOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="flex flex-col md:flex-row gap-2 items-start bg-secondary/50 p-3 rounded-md animate-in fade-in-0 zoom-in-95">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-grow w-full">
                <FormField
                  control={form.control}
                  name={`entries.${index}.accountId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Account</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`entries.${index}.amount`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Amount</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Amount" {...field} />
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`entries.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Type</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="debit">To</SelectItem>
                          <SelectItem value="credit">From</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => remove(index)} disabled={fields.length <= 2}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => append({ accountId: '', type: 'debit', amount: 0 })}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Entry
          </Button>
          {form.formState.errors.entries?.message && <FormMessage>{form.formState.errors.entries.message}</FormMessage>}
        </div>

        <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between font-mono text-sm">
                <span>Total To:</span>
                <span className="text-chart-2 font-semibold">{formatCurrency(totalDebits)}</span>
            </div>
            <div className="flex justify-between font-mono text-sm">
                <span>Total From:</span>
                <span className="text-chart-3 font-semibold">{formatCurrency(totalCredits)}</span>
            </div>
             <div className="flex justify-between font-mono text-sm font-bold border-t pt-2 mt-2">
                <span>Difference:</span>
                <span className={cn(Math.abs(totalDebits-totalCredits) > 0.01 ? 'text-destructive' : 'text-chart-2')}>{formatCurrency(totalDebits-totalCredits)}</span>
            </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {isPending ? 'Saving...' : 'Save Transaction'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
