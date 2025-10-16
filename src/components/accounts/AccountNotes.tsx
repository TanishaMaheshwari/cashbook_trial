
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FilePenLine } from 'lucide-react';

type AccountNotesProps = {
  accountId: string;
};

export default function AccountNotes({ accountId }: AccountNotesProps) {
  const [notes, setNotes] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  const storageKey = `account_notes_${accountId}`;

  useEffect(() => {
    const savedNotes = localStorage.getItem(storageKey);
    if (savedNotes) {
      setNotes(savedNotes);
    }
    setIsMounted(true);
  }, [storageKey]);

  const handleSave = () => {
    localStorage.setItem(storageKey, notes);
    toast({
      title: 'Notes Saved',
      description: 'Your notes for this account have been saved locally.',
    });
  };

  if (!isMounted) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="animate-pulse space-y-2">
                    <div className="h-24 bg-muted rounded-md"></div>
                    <div className="h-10 w-24 bg-muted rounded-md"></div>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FilePenLine className="h-5 w-5 text-muted-foreground" />
          <span>Account Notes</span>
        </CardTitle>
        <CardDescription>
          Your private scratchpad for this account. Notes are saved locally in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Jot down reminders, contact info, or anything else..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={10}
        />
        <Button onClick={handleSave} className="w-full">Save Notes</Button>
      </CardContent>
    </Card>
  );
}
