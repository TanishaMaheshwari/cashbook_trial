'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { createCategoryAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@/lib/types";
import { useBooks } from "@/context/BookContext";

export default function ManageCategories({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { activeBook } = useBooks();

  const handleAddCategory = () => {
    if (!activeBook) return;
    startTransition(async () => {
      const result = await createCategoryAction(activeBook.id, newCategoryName);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        setNewCategoryName("");
        setOpen(false);
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FolderPlus className="mr-2 h-4 w-4" />
          Manage Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Manage Categories</DialogTitle>
          <DialogDescription>
            View existing categories and add new ones to organize your accounts for the current book.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <h4 className="font-semibold mb-2">Existing Categories</h4>
            <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                    <span key={cat.id} className="text-sm bg-secondary text-secondary-foreground px-2 py-1 rounded-md">{cat.name}</span>
                ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-right">
              New Category Name
            </Label>
            <Input
              id="name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Long-term Assets"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAddCategory} disabled={isPending || !newCategoryName.trim()}>
            {isPending ? "Adding..." : "Add Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
