
'use server';

import { revalidatePath } from 'next/cache';
import { addTransaction, addCategory, deleteTransaction, addAccount, deleteAccount, updateTransaction, updateTransactionHighlight, deleteMultipleAccounts, getBooks, addBook, updateBook, deleteBook, deleteCategory, updateAccount } from '@/lib/data';
import type { Transaction, Account } from '@/lib/types';

export async function createTransactionAction(bookId: string, data: Omit<Transaction, 'id' | 'date' | 'bookId'> & { date: Date }) {
  try {
    await addTransaction(bookId, {
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

export async function updateTransactionAction(bookId: string, id: string, data: Omit<Transaction, 'id' | 'date' | 'bookId'> & { date: Date }) {
  try {
    await updateTransaction(bookId, id, {
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


export async function createCategoryAction(bookId: string, name: string) {
    if (!name || name.trim().length === 0) {
        return { success: false, message: "Category name cannot be empty." };
    }
    try {
        await addCategory(bookId, name);
        revalidatePath('/');
        revalidatePath('/accounts');
        revalidatePath('/categories');
        return { success: true, message: `Category '${name}' created.` };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to create category: ${errorMessage}` };
    }
}

export async function deleteCategoryAction(bookId: string, categoryId: string) {
    try {
        await deleteCategory(bookId, categoryId);
        revalidatePath('/categories');
        revalidatePath('/accounts');
        return { success: true, message: 'Category deleted successfully.' };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to delete category: ${errorMessage}` };
    }
}

export async function deleteTransactionAction(bookId: string, transactionId: string) {
  try {
    await deleteTransaction(bookId, transactionId);
    revalidatePath('/');
    revalidatePath('/transactions');
    revalidatePath('/accounts');
    return { success: true, message: 'Transaction deleted successfully.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to delete transaction: ${errorMessage}` };
  }
}

export async function createAccountAction(bookId: string, data: Omit<Account, 'id' | 'bookId'>) {
    try {
        await addAccount(bookId, data);
        revalidatePath('/accounts');
        revalidatePath('/');
        return { success: true, message: 'Account created successfully.' };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to create account: ${errorMessage}` };
    }
}

export async function updateAccountAction(bookId: string, accountId: string, data: Partial<Omit<Account, 'id' | 'bookId'>>) {
    try {
        await updateAccount(bookId, accountId, data);
        revalidatePath('/accounts');
        revalidatePath('/');
        return { success: true, message: 'Account updated successfully.' };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to update account: ${errorMessage}` };
    }
}

export async function deleteAccountAction(bookId: string, accountId: string) {
    try {
        await deleteAccount(bookId, accountId);
        revalidatePath('/accounts');
        revalidatePath('/');
        return { success: true, message: 'Account deleted successfully.' };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to delete account: ${errorMessage}` };
    }
}

export async function deleteMultipleAccountsAction(bookId: string, accountIds: string[]) {
    try {
        await deleteMultipleAccounts(bookId, accountIds);
        revalidatePath('/accounts');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to delete accounts: ${errorMessage}` };
    }
}

export async function updateTransactionHighlightAction(bookId: string, transactionId: string, highlight: Transaction['highlight'] | null) {
  try {
    await updateTransactionHighlight(bookId, transactionId, highlight);
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
    revalidatePath('/'); // To update the book name in the header
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
     revalidatePath('/'); // To update the book list
    return { success: true, message: 'Book deleted.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to delete book: ${errorMessage}` };
  }
}
