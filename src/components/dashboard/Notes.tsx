'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Lightbulb, Trash2, Plus, ListTodo } from 'lucide-react';
import { useBooks } from '@/context/BookContext';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

type NoteItem = {
  id: string;
  text: string;
  isCompleted: boolean;
};

export default function Notes() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { activeBook } = useBooks();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const storageKey = activeBook ? `dashboard_notes_${activeBook.id}` : null;

  useEffect(() => {
    if (storageKey) {
      const savedNotes = localStorage.getItem(storageKey);
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      } else {
        setNotes([]);
      }
      setIsLoaded(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (isLoaded && storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(notes));
    }
  }, [notes, storageKey, isLoaded]);

  const handleAddNote = () => {
    if (newNoteText.trim()) {
      const newNote: NoteItem = {
        id: `note_${Date.now()}`,
        text: newNoteText.trim(),
        isCompleted: false,
      };
      setNotes(prev => [...prev, newNote]);
      setNewNoteText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddNote();
    }
  };
  
  const handleToggleComplete = (id: string) => {
    setNotes(notes.map(note =>
      note.id === id ? { ...note, isCompleted: !note.isCompleted } : note
    ));
  };
  
  const handleDeleteNote = (id: string) => {
      setNotes(notes.filter(note => note.id !== id));
  };

  const handleFocus = () => {
    setIsFocused(true);
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const currentTarget = e.currentTarget;
    // We use a timeout to allow click events on buttons inside the card to register
    setTimeout(() => {
      if (!currentTarget.contains(document.activeElement)) {
        setIsFocused(false);
        if(newNoteText.trim()) {
            handleAddNote();
        }
      }
    }, 0);
  };
  
  const completedNotes = notes.filter(n => n.isCompleted);
  const activeNotes = notes.filter(n => !n.isCompleted);


  return (
    <Card 
      className={cn("transition-all duration-300 ease-in-out", isFocused ? "shadow-lg" : "shadow-sm")}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={-1}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4 w-full">
            <Lightbulb className={cn("h-6 w-6 text-muted-foreground transition-colors", isFocused && 'text-yellow-500')} />
            <Input
                ref={inputRef}
                placeholder="Take a note..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-grow border-none focus-visible:ring-0 shadow-none text-base"
            />
            <Button variant="ghost" size="icon" onClick={handleAddNote} disabled={!newNoteText.trim()}>
                <Plus />
            </Button>
        </div>

        {activeNotes.length > 0 && (
          <div className="mt-4 space-y-2">
            {activeNotes.map(note => (
              <div key={note.id} className="flex items-center gap-3 group">
                <Checkbox
                  id={note.id}
                  checked={note.isCompleted}
                  onCheckedChange={() => handleToggleComplete(note.id)}
                />
                <label
                  htmlFor={note.id}
                  className={cn(
                    "flex-grow text-sm cursor-pointer",
                    note.isCompleted && "line-through text-muted-foreground"
                  )}
                >
                  {note.text}
                </label>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteNote(note.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {completedNotes.length > 0 && (
            <div className="mt-6">
                <Separator />
                <h3 className="text-sm font-semibold my-2 flex items-center gap-2 text-muted-foreground"><ListTodo className="h-4 w-4"/> Completed ({completedNotes.length})</h3>
                <div className="space-y-2">
                    {completedNotes.map(note => (
                       <div key={note.id} className="flex items-center gap-3 group">
                        <Checkbox
                          id={note.id}
                          checked={note.isCompleted}
                          onCheckedChange={() => handleToggleComplete(note.id)}
                        />
                        <label
                          htmlFor={note.id}
                          className="flex-grow text-sm text-muted-foreground line-through cursor-pointer"
                        >
                          {note.text}
                        </label>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteNote(note.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                </div>
            </div>
        )}

      </CardContent>
    </Card>
  );
}
