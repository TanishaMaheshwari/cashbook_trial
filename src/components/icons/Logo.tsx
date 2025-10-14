import { Scale } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-3" aria-label="CASHBOOK Logo">
      <div className="bg-primary/20 text-primary p-2 rounded-lg">
         <Scale className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-headline font-bold text-foreground tracking-wide">
        CASHBOOK
      </h1>
    </div>
  );
}
