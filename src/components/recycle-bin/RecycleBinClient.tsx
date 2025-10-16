'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Book, Folder, RotateCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { restoreItemAction, deletePermanentlyAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

type RecycledItem = {
  type: 'transaction' | 'account' | 'category' | 'book';
  deletedAt: string;
  id: string;
  [key: string]: any;
};

type RecycleBinClientProps = {
  initialItems: RecycledItem[];
};

const iconMap = {
  transaction: <Trash2 className="h-5 w-5" />,
  account: <Trash2 className="h-5 w-5" />,
  category: <Folder className="h-5 w-5" />,
  book: <Book className="h-5 w-5" />,
};

const getTitle = (item: RecycledItem) => {
  switch (item.type) {
    case 'transaction':
      return item.description;
    case 'account':
    case 'category':
    case 'book':
      return item.name;
    default:
      return 'Unknown Item';
  }
};

export default function RecycleBinClient({ initialItems }: RecycleBinClientProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSelect = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(initialItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };
  
  const handleAction = async (action: 'restore' | 'delete', itemsToProcess: RecycledItem[]) => {
      startTransition(async () => {
          const results = await Promise.all(itemsToProcess.map(item => 
              action === 'restore' ? restoreItemAction(item) : deletePermanentlyAction(item)
          ));

          const successes = results.filter(r => r.success).length;
          const failures = results.length - successes;

          if (successes > 0) {
              toast({
                  title: 'Success',
                  description: `${successes} item(s) ${action === 'restore' ? 'restored' : 'deleted'}.`,
              });
          }
          if (failures > 0) {
              toast({
                  title: 'Error',
                  description: `Failed to ${action} ${failures} item(s). See console for details.`,
                  variant: 'destructive',
              });
              results.filter(r => !r.success).forEach(r => console.error(r.message));
          }
          
          setSelectedItems([]);
      });
  };

  const itemsById = Object.fromEntries(initialItems.map(item => [item.id, item]));
  const getSelectedItems = () => selectedItems.map(id => itemsById[id]);


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-headline">Recycle Bin</h1>
        <Button variant="outline" asChild>
          <Link href="/settings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
           <div>
            <CardTitle>Deleted Items</CardTitle>
            <CardDescription>
                Items deleted in the last 30 days are shown here.
            </CardDescription>
           </div>
           {selectedItems.length > 0 && (
               <div className="flex items-center gap-2">
                   <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="outline"><RotateCcw className="mr-2 h-4 w-4"/> Restore ({selectedItems.length})</Button></AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Restore Selected Items?</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure you want to restore {selectedItems.length} item(s)?</AlertDialogDescription>
                          </AlertDialogHeader>
                           <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleAction('restore', getSelectedItems())} disabled={isPending}>
                                    {isPending ? 'Restoring...' : 'Restore'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                      </AlertDialogContent>
                   </AlertDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="mr-2 h-4 w-4"/> Delete ({selectedItems.length})</Button></AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Permanently Delete Items?</AlertDialogTitle>
                              <AlertDialogDescription>This action cannot be undone. This will permanently delete {selectedItems.length} item(s).</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleAction('delete', getSelectedItems())} className="bg-destructive hover:bg-destructive/90" disabled={isPending}>
                                    {isPending ? 'Deleting...' : 'Delete Permanently'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                      </AlertDialogContent>
                   </AlertDialog>
               </div>
           )}
        </CardHeader>
        <CardContent>
          {initialItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-48">
              <Trash2 className="h-12 w-12 mb-4" />
              <p>The recycle bin is empty.</p>
            </div>
          ) : (
            <ScrollArea className="h-[60vh]">
              <div className="flex items-center border-b p-4">
                 <Checkbox 
                    id="select-all"
                    checked={selectedItems.length === initialItems.length && initialItems.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    className="mr-4"
                />
                <label htmlFor="select-all" className="text-sm font-medium">Select All</label>
              </div>
              <ul className="space-y-3 p-4">
                {initialItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded-lg border p-4 data-[state=selected]:bg-muted/50" data-state={selectedItems.includes(item.id) ? 'selected' : 'unselected'}>
                    <div className="flex items-center gap-4">
                       <Checkbox 
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={(checked) => handleSelect(item.id, !!checked)}
                        />
                      <div className="text-muted-foreground">{iconMap[item.type]}</div>
                      <div>
                        <p className="font-semibold">{getTitle(item)}</p>
                        <p className="text-sm text-muted-foreground">
                          Deleted on {format(new Date(item.deletedAt), 'PPP')}
                        </p>
                      </div>
                       <Badge variant="secondary" className="capitalize">{item.type}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                       <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="sm"><RotateCcw className="mr-2 h-4 w-4" /> Restore</Button></AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Restore this item?</AlertDialogTitle>
                                  <AlertDialogDescription>Are you sure you want to restore this {item.type}?</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleAction('restore', [item])} disabled={isPending}>{isPending ? 'Restoring...' : 'Restore'}</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                       </AlertDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="mr-2 h-4 w-4"/> Delete</Button></AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Permanently delete this item?</AlertDialogTitle>
                                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleAction('delete', [item])} className="bg-destructive hover:bg-destructive/90" disabled={isPending}>{isPending ? 'Deleting...' : 'Delete Permanently'}</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                       </AlertDialog>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
