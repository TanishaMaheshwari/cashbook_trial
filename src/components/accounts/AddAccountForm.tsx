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
import { useBooks } from '@/context/BookContext';

const formSchema = z.object({
  name: z.string().min(3, 'Account name must be at least 3 characters.').max(100),
  categoryId: z.string().min(1, 'Category is required.'),
  openingDebit: z.coerce.number().min(0).optional(),
  openingCredit: z.coerce.number().min(0).optional(),
})
.refine(data => !(data.openingDebit && data.openingCredit), {
    message: "Opening balance can be either a debit or a credit, not both.",
    path: ["openingDebit"],
});


type AddAccountFormProps = {
  categories: Category[];
  onFinished: () => void;
};

export default function AddAccountForm({ categories, onFinished }: AddAccountFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { activeBook } = useBooks();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      openingDebit: 0,
      openingCredit: 0
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!activeBook) return;
    startTransition(async () => {
      const result = await createAccountAction(activeBook.id, values);
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

        <div>
            <FormLabel>Opening Balance (Optional)</FormLabel>
            <FormDescription>If this account has a starting balance, enter it here.</FormDescription>
            <div className="grid grid-cols-2 gap-4 mt-2">
                <FormField
                control={form.control}
                name="openingDebit"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Debit (Dr)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="openingCredit"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Credit (Cr)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Account'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
