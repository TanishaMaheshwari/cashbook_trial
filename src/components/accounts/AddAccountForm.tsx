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
import { createAccountAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

const accountTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;

const formSchema = z.object({
  name: z.string().min(3, 'Account name must be at least 3 characters.').max(100),
  categoryId: z.string().min(1, 'Category is required.'),
  type: z.enum(accountTypes, { required_error: 'Account type is required.' }),
});

type AddAccountFormProps = {
  categories: Category[];
  onFinished: () => void;
};

export default function AddAccountForm({ categories, onFinished }: AddAccountFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      type: undefined,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      const result = await createAccountAction(values);
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
            name="type"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {accountTypes.map(type => (
                                <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormDescription>
                        Asset/Expense increase with Debits. Liability/Equity/Revenue increase with Credits.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Account'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
