
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Account, Category } from '@/lib/types';
import { useTransition } from 'react';
import { updateAccountAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useBooks } from '@/context/BookContext';

const formSchema = z.object({
  name: z.string().min(3, 'Account name must be at least 3 characters.').max(100),
  categoryId: z.string().min(1, 'Category is required.'),
  openingBalance: z.coerce.number().min(0).optional(),
});


type EditAccountFormProps = {
  account: Account;
  categories: Category[];
  onFinished: () => void;
};

export default function EditAccountForm({ account, categories, onFinished }: EditAccountFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { activeBook } = useBooks();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: account.name,
      categoryId: account.categoryId,
      openingBalance: account.openingBalance || 0,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!activeBook) return;
    startTransition(async () => {
      const result = await updateAccountAction(activeBook.id, account.id, values);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        onFinished();
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Savings Account" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="openingBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opening Balance</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormDescription>
                This is for informational purposes only and does not create or update a transaction.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
