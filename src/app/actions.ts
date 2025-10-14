'use server';

import { revalidatePath } from 'next/cache';
import { addTransaction, addCategory, deleteTransaction, addAccount, deleteAccount, updateTransaction, updateTransactionHighlight, deleteMultipleAccounts, getBooks, addBook, updateBook, deleteBook, deleteCategory } from '@/lib/data';
import type { Transaction, Account, AccountType } from '@/lib/types';

export async function createTransactionAction(data: Omit<Transaction, 'id' | 'date'> & { date: Date }) {
  try {
    await addTransaction({
      ...data,
      date: data.date.toISOString(),
    });
    
    revalidatePath('/');
    revalidatePath('/transactions');
    revalidatePath('/accounts');
    
    return { success: true, message: 'Transaction added successfully.' };
  } catch (error) {
    return { success: false, message: 'Failed to create transaction.' };
  }
}

export async function updateTransactionAction(id: string, data: Omit<Transaction, 'id' | 'date'> & { date: Date }) {
  try {
    await updateTransaction(id, {
      ...data,
      date: data.date.toISOString(),
    });
    
    revalidatePath('/');
    revalidatePath('/transactions');
    revalidatePath('/accounts');
    
    return { success: true, message: 'Transaction updated successfully.' };
  } catch (error) {
     const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to update transaction: ${errorMessage}` };
  }
}


export async function createCategoryAction(name: string) {
    if (!name || name.trim().length === 0) {
        return { success: false, message: "Category name cannot be empty." };
    }
    try {
        await addCategory(name);
        revalidatePath('/');
        revalidatePath('/accounts');
        revalidatePath('/categories');
        return { success: true, message: `Category '${name}' created.` };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to create category: ${errorMessage}` };
    }
}

export async function deleteCategoryAction(categoryId: string) {
    try {
        await deleteCategory(categoryId);
        revalidatePath('/categories');
        revalidatePath('/accounts');
        return { success: true, message: 'Category deleted successfully.' };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to delete category: ${errorMessage}` };
    }
}

export async function deleteTransactionAction(transactionId: string) {
  try {
    await deleteTransaction(transactionId);
    revalidatePath('/');
    revalidatePath('/transactions');
    revalidatePath('/accounts');
    return { success: true, message: 'Transaction deleted successfully.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to delete transaction: ${errorMessage}` };
  }
}

export async function createAccountAction(data: Omit<Account, 'id'>) {
    try {
        await addAccount(data);
        revalidatePath('/accounts');
        revalidatePath('/');
        return { success: true, message: 'Account created successfully.' };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to create account: ${errorMessage}` };
    }
}

export async function deleteAccountAction(accountId: string) {
    try {
        await deleteAccount(accountId);
        revalidatePath('/accounts');
        revalidatePath('/');
        return { success: true, message: 'Account deleted successfully.' };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to delete account: ${errorMessage}` };
    }
}

export async function deleteMultipleAccountsAction(accountIds: string[]) {
    try {
        await deleteMultipleAccounts(accountIds);
        revalidatePath('/accounts');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to delete accounts: ${errorMessage}` };
    }
}

export async function updateTransactionHighlightAction(transactionId: string, highlight: Transaction['highlight'] | null) {
  try {
    await updateTransactionHighlight(transactionId, highlight);
    revalidatePath('/transactions');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to update highlight: ${errorMessage}` };
  }
}

// --- Book Actions ---
export async function addBookAction(name: string) {
  try {
    await addBook(name);
    revalidatePath('/settings');
    return { success: true, message: `Book '${name}' created.` };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to create book: ${errorMessage}` };
  }
}

export async function updateBookAction(id: string, name: string) {
  try {
    await updateBook(id, name);
    revalidatePath('/settings');
    return { success: true, message: 'Book name updated.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to update book: ${errorMessage}` };
  }
}

export async function deleteBookAction(id: string) {
  try {
    await deleteBook(id);
    revalidatePath('/settings');
    return { success: true, message: 'Book deleted.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to delete book: ${errorMessage}` };
  }
}
