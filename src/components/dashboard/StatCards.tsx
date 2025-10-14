'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { Category } from '@/lib/types';
import { ArrowDownCircle, ArrowUpCircle, Scale } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


type StatCardsProps = {
  stats: {
    totalDebit: number;
    totalCredit: number;
    difference: number;
    selectedCategoryBalance?: { id: string; name: string; balance: number };
  };
  categories: Category[];
  selectedCategoryId?: string;
  onCategoryChange: (id: string) => void;
};

const StatCard = ({ title, value, icon: Icon, colorClass }: { title: React.ReactNode; value: string; icon: React.ElementType; colorClass?: string }) => (
  <Card className="transition-all hover:shadow-md hover:-translate-y-1">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${colorClass || 'text-muted-foreground'}`} />
    </CardHeader>
    <CardContent>
      <div className="font-bold text-2xl">{value}</div>
    </CardContent>
  </Card>
);

export default function StatCards({ stats, categories, selectedCategoryId, onCategoryChange }: StatCardsProps) {
  return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Flow In" value={formatCurrency(stats.totalDebit)} icon={ArrowDownCircle} colorClass="text-chart-2" />
        <StatCard title="Total Flow Out" value={formatCurrency(stats.totalCredit)} icon={ArrowUpCircle} colorClass="text-chart-3" />
        <StatCard title="Difference" value={formatCurrency(stats.difference)} icon={Scale} colorClass={stats.difference !== 0 ? 'text-destructive' : 'text-chart-2'} />
        {stats.selectedCategoryBalance && (
          <StatCard
            key={stats.selectedCategoryBalance.id}
            title={
                <Select onValueChange={onCategoryChange} defaultValue={selectedCategoryId}>
                    <SelectTrigger className="border-none !bg-transparent p-0 h-auto focus:ring-0 focus:ring-offset-0">
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                    {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                        {category.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            }
            value={formatCurrency(stats.selectedCategoryBalance.balance)}
            icon={Scale}
        />
        )}
      </div>
  );
}
