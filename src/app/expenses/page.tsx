
"use client";

import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, ListChecks, PlusCircle, Trash2, MoreHorizontal, Utensils, Car, Shirt, Home, Gift } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
}

const initialExpenses: Expense[] = [
  { id: "1", date: "2024-07-20", category: "Food & Dining", description: "Groceries from SuperMart", amount: 75.50 },
  { id: "2", date: "2024-07-19", category: "Transportation", description: "Monthly metro pass", amount: 55.00 },
  { id: "3", date: "2024-07-18", category: "Shopping", description: "Movie tickets - Space Odyssey", amount: 25.00 },
  { id: "4", date: "2024-07-17", category: "Housing", description: "Electricity bill", amount: 120.75 },
];

// Define Category interface (mirrors the one in categories/page.tsx)
interface Category {
  id: string;
  name: string;
  icon: LucideIcon; 
  color?: string;
}

// Use a similar initial categories list as in categories/page.tsx
// In a real app, this would come from a shared store or API
const pageCategories: Category[] = [
  { id: "1", name: "Food & Dining", icon: Utensils, color: "hsl(30, 80%, 60%)" },
  { id: "2", name: "Transportation", icon: Car, color: "hsl(200, 70%, 60%)" },
  { id: "3", name: "Shopping", icon: Shirt, color: "hsl(300, 60%, 60%)" },
  { id: "4", name: "Housing", icon: Home, color: "hsl(120, 50%, 50%)" },
  { id: "5", name: "Gifts", icon: Gift, color: "hsl(0, 70%, 65%)" },
];


export default function ExpensesPage() {
  const [expenses, setExpenses] = React.useState<Expense[]>(initialExpenses);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);

  const handleOpenDialog = (expense?: Expense) => {
    setEditingExpense(expense || null);
    setIsDialogOpen(true);
  };
  
  const handleSaveExpense = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newExpense = {
      id: editingExpense?.id || String(Date.now()),
      date: formData.get("date") as string,
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      amount: parseFloat(formData.get("amount") as string),
    };

    if (editingExpense) {
      setExpenses(exps => exps.map(e => e.id === editingExpense.id ? newExpense : e));
    } else {
      setExpenses(exps => [newExpense, ...exps].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
    setIsDialogOpen(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(exps => exps.filter(e => e.id !== id));
  };

  return (
    <AppLayout>
      <PageHeader
        title="Expenses"
        actionButtonText="Add Expense"
        ActionIcon={PlusCircle}
        onActionButtonClick={() => handleOpenDialog()}
      />

      {expenses.length === 0 ? (
        <EmptyState
          IconCmp={ListChecks}
          title="No Expenses Recorded"
          description="Start tracking your expenses to get a better view of your finances."
          actionButtonText="Add First Expense"
          onActionButtonClick={() => handleOpenDialog()}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell>{new Date(exp.date).toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant="outline">{exp.category}</Badge></TableCell>
                  <TableCell className="font-medium">{exp.description}</TableCell>
                  <TableCell className="text-right">${exp.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(exp)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteExpense(exp.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Edit" : "Add"} Expense</DialogTitle>
            <DialogDescription>
              {editingExpense ? "Update the details of your expense." : "Enter the details for the new expense."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveExpense} className="space-y-4">
            <div>
              <Label htmlFor="date" className="mb-1 block">Date</Label>
              <Input id="date" name="date" type="date" defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]} required />
            </div>
            <div>
              <Label htmlFor="amount" className="mb-1 block">Amount ($)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingExpense?.amount} placeholder="0.00" required />
            </div>
             <div>
              <Label htmlFor="category" className="mb-1 block">Category</Label>
              <select 
                id="category" 
                name="category" 
                defaultValue={editingExpense?.category || (pageCategories.length > 0 ? pageCategories[0].name : "")} 
                required
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pageCategories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="description" className="mb-1 block">Description</Label>
              <Textarea id="description" name="description" defaultValue={editingExpense?.description} placeholder="e.g., Lunch with colleagues" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Expense</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

