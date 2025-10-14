'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Book, Folder, RotateCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';

type RecycledItem = {
  type: 'transaction' | 'account' | 'category' | 'book';
  deletedAt: string;
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
  const [items] = useState(initialItems);

  const handleRestore = (item: RecycledItem) => {
    // Restore logic will be implemented later
    alert(`Restore functionality for ${item.type} not yet implemented.`);
  };

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
        <CardHeader>
          <CardTitle>Deleted Items</CardTitle>
          <CardDescription>
            Items deleted in the last 30 days are shown here. You can restore them if needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-48">
              <Trash2 className="h-12 w-12 mb-4" />
              <p>The recycle bin is empty.</p>
            </div>
          ) : (
            <ScrollArea className="h-[60vh]">
              <ul className="space-y-3">
                {items.map((item, index) => (
                  <li key={`${item.id}-${index}`} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
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
                       <Button variant="ghost" size="sm" onClick={() => handleRestore(item)} disabled>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restore
                       </Button>
                       <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled>
                          Delete Permanently
                       </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      
       <Alert>
          <AlertTitle>Note</AlertTitle>
          <AlertDescription>
            The restore functionality is not yet implemented. This view is currently read-only.
          </AlertDescription>
        </Alert>

    </div>
  );
}
