'use server';

import { revalidatePath } from 'next/cache';
import { addTransaction, addCategory } from '@/lib/data';
import type { Transaction } from '@/lib/types';

export async function createTransactionAction(data: Omit<Transaction, 'id' | 'date'> & { date: Date }) {
  try {
    await addTransaction({
      ...data,
      date: data.date.toISOString(),
    });
    
    revalidatePath('/');
    
    return { success: true, message: 'Transaction added successfully.' };
  } catch (error) {
    return { success: false, message: 'Failed to create transaction.' };
  }
}

export async function createCategoryAction(name: string) {
    if (!name || name.trim().length === 0) {
        return { success: false, message: "Category name cannot be empty." };
    }
    try {
        await addCategory(name);
        revalidatePath('/');
        return { success: true, message: `Category '${name}' created.` };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to create category: ${errorMessage}` };
    }
}
