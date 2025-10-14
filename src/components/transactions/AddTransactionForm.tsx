'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn, formatCurrency } from '@/lib/utils';
import type { Account, Category, Transaction } from '@/lib/types';
import { useTransition, useMemo, useState, useEffect } from 'react';
import { createTransactionAction, updateTransactionAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AddAccountForm from '@/components/accounts/AddAccountForm';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';
import { Combobox } from '@/components/ui/combobox';

const transactionEntrySchema = z.object({
  accountId: z.string().min(1, 'Account is required.'),
  type: z.enum(['debit', 'credit']),
  amount: z.coerce.number().positive('Amount must be positive.'),
  description: z.string().optional(),
});

const formSchema = z.object({
  description: z.string().min(3, 'Description must be at least 3 characters.').max(100),
  date: z.date({ required_error: 'Date is required.' }),
  entries: z.array(transactionEntrySchema).min(2, 'At least one debit and one credit entry are required.'),
  useSeparateNarration: z.boolean().default(false),
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
  initialData?: Transaction | null;
};

type TransactionView = 'to_from' | 'dr_cr';

export default function AddTransactionForm({ accounts, onFinished, initialData }: AddTransactionFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isAddAccountOpen, setAddAccountOpen] = useState(false);
  const [transactionView, setTransactionView] = useState<TransactionView>('to_from');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const storedView = localStorage.getItem('transactionView') as TransactionView | null;
    if (storedView) {
      setTransactionView(storedView);
    }
    setIsMounted(true);
  }, []);

  const isEditMode = !!initialData;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      date: new Date(),
      entries: [
        { accountId: '', type: 'credit', amount: 0, description: '' },
        { accountId: '', type: 'debit', amount: 0, description: '' },
      ],
      useSeparateNarration: false,
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'entries',
  });

  const [isSplit, setIsSplit] = useState(false);

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        date: new Date(initialData.date),
        entries: initialData.entries.map(e => ({...e, description: e.description || ''})),
        useSeparateNarration: initialData.entries.some(e => e.description)
      });
      if (initialData.entries.length > 2) {
        setIsSplit(true);
      }
    } else {
        form.reset({
            description: '',
            date: new Date(),
            entries: [
                { accountId: '', type: 'credit', amount: 0, description: '' },
                { accountId: '', type: 'debit', amount: 0, description: '' },
            ],
            useSeparateNarration: false,
        });
        setIsSplit(false);
    }
  }, [initialData, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      const result = isEditMode
        ? await updateTransactionAction(initialData.id, values)
        : await createTransactionAction(values);

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
  const useSeparateNarration = form.watch('useSeparateNarration');
  const { totalDebits, totalCredits } = useMemo(() => {
    const debits = watchedEntries.filter(e => e.type === 'debit').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const credits = watchedEntries.filter(e => e.type === 'credit').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { totalDebits: debits, totalCredits: credits };
  }, [watchedEntries]);

  const handleAmountSync = (index: number, amount: number) => {
    if (!isSplit && fields.length === 2) {
        const otherIndex = index === 0 ? 1 : 0;
        form.setValue(`entries.${otherIndex}.amount`, amount);
    }
  }

  const creditFields = fields.map((field, index) => ({ field, index })).filter(({ field }) => field.type === 'credit');
  const debitFields = fields.map((field, index) => ({ field, index })).filter(({ field }) => field.type === 'debit');
  
  const dummyCategories: Category[] = [];

  const accountOptions = useMemo(() => accounts.map(acc => ({ value: acc.id, label: acc.name })), [accounts]);

  const fromLabel = transactionView === 'dr_cr' ? 'Credit Account' : 'From Account';
  const toLabel = transactionView === 'dr_cr' ? 'Debit Account' : 'To Account';

  const EntryCard = ({ index, type }: { index: number, type: 'credit' | 'debit' }) => (
    <Card className={cn("w-full", type === 'credit' ? 'bg-red-50/50 dark:bg-red-950/20' : 'bg-green-50/50 dark:bg-green-950/20')}>
      <CardContent className="p-4 space-y-4">
        <h4 className={cn("font-semibold", type === 'credit' ? 'text-red-700' : 'text-green-700')}>
            {type === 'credit' ? fromLabel : toLabel}
        </h4>
         <FormField
          control={form.control}
          name={`entries.${index}.accountId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">{type === 'credit' ? fromLabel : toLabel}</FormLabel>
                <FormControl>
                    <Combobox
                        options={accountOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select an account"
                        searchPlaceholder="Search accounts..."
                        notFoundPlaceholder="No account found."
                    />
                </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`entries.${index}.amount`}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...formField}
                  onChange={(e) => {
                      const amount = parseFloat(e.target.value) || 0;
                      formField.onChange(amount);
                      handleAmountSync(index, amount);
                  }}
                  className="bg-background"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         {useSeparateNarration && (
            <FormField
              control={form.control}
              name={`entries.${index}.description`}
              render={({ field: formField }) => (
                <FormItem>
                  <FormLabel className="sr-only">Line Description</FormLabel>
                  <FormControl>
                      <Input placeholder="Line item description (optional)" {...formField} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

         {isSplit && (
            <div className="flex justify-end">
                <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(index)} disabled={fields.length <= 2}>
                  <Trash2 className="mr-2 h-4 w-4" /> Remove
                </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );

  if (!isMounted) {
    return <div>Loading form...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
           <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Transaction Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn('w-[240px] pl-3 text-left font-normal bg-background', !field.value && 'text-muted-foreground')}>
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
        </div>
        
        <Card>
            <CardContent className="p-6 space-y-6">
                 <FormField
                    control={form.control}
                    name="useSeparateNarration"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <FormLabel className="font-normal">
                                Use separate narration for each entry
                            </FormLabel>
                        </FormItem>
                    )}
                 />

                 <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Narration</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Description of transaction..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-4">
                        {creditFields.map(({ field, index }) => <EntryCard key={field.id} index={index} type="credit" />)}
                        {isSplit && (
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ accountId: '', type: 'credit', amount: 0, description: '' })} className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add {transactionView === 'dr_cr' ? 'Credit' : 'From'} Account
                            </Button>
                        )}
                    </div>
                    <div className="space-y-4">
                        {debitFields.map(({ field, index }) => <EntryCard key={field.id} index={index} type="debit" />)}
                        {isSplit && (
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ accountId: '', type: 'debit', amount: 0, description: '' })} className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add {transactionView === 'dr_cr' ? 'Debit' : 'To'} Account
                            </Button>
                        )}
                    </div>
                </div>

                {!isSplit && !isEditMode && (
                    <div className="flex items-center space-x-2">
                        <Checkbox id="enable-split" onCheckedChange={(checked) => setIsSplit(!!checked)} checked={isSplit} />
                        <label htmlFor="enable-split" className="text-sm font-medium leading-none">Enable Split/Compound Entry</label>
                    </div>
                )} 

                {(isSplit || (totalCredits > 0 || totalDebits > 0)) && (
                   <div className="bg-muted p-4 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                          <span>Total {transactionView === 'dr_cr' ? 'Debits' : 'To'}:</span>
                          <span className="text-green-600 font-semibold">{formatCurrency(totalDebits)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span>Total {transactionView === 'dr_cr' ? 'Credits' : 'From'}:</span>
                          <span className="text-red-600 font-semibold">{formatCurrency(totalCredits)}</span>
                      </div>
                       <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
                          <span>Difference:</span>
                          <span className={cn(Math.abs(totalDebits-totalCredits) > 0.01 ? 'text-destructive' : 'text-green-600')}>{formatCurrency(totalDebits-totalCredits)}</span>
                      </div>
                  </div>
                )}
                 {form.formState.errors.entries && <FormMessage>{form.formState.errors.entries.message || form.formState.errors.entries.root?.message}</FormMessage>}
            </CardContent>
        </Card>


        <div className="flex items-center justify-between">
          <Button type="submit" disabled={isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {isPending ? (isEditMode ? 'Saving...' : 'Recording...') : (isEditMode ? 'Save Changes' : 'Record Transaction')}
          </Button>

          <Dialog open={isAddAccountOpen} onOpenChange={setAddAccountOpen}>
              <DialogTrigger asChild>
                 <Button variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-headline text-2xl">Add New Account</DialogTitle>
                </DialogHeader>
                <AddAccountForm categories={dummyCategories} onFinished={() => setAddAccountOpen(false)} />
              </DialogContent>
            </Dialog>
        </div>
      </form>
    </Form>
  );
}
