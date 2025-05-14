
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
import { Edit, ListChecks, PlusCircle, Trash2, MoreHorizontal, Utensils, Car, Shirt, Home, Gift, Shapes } from "lucide-react";
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
  category: string; // Category name
  description: string;
  amount: number;
}

// Interface for category data used in localStorage (icon as string name)
interface StoredCategory {
  id: string;
  name: string;
  iconName: string;
  color?: string;
}

// Interface for category data used in component state (icon as LucideIcon component)
interface Category {
  id: string;
  name: string;
  icon: LucideIcon; 
  color?: string;
}

const APP_EXPENSES_STORAGE_KEY = "remindme_expenses";
const APP_CATEGORIES_STORAGE_KEY = "remindme_categories";

const availableIcons: { name: string; component: LucideIcon }[] = [
    { name: "Utensils", component: Utensils },
    { name: "Car", component: Car },
    { name: "Shirt", component: Shirt },
    { name: "Home", component: Home },
    { name: "Gift", component: Gift },
    { name: "Shapes", component: Shapes }, // Default
];

const mapStoredToCategory = (storedCat: StoredCategory): Category => ({
  ...storedCat,
  icon: availableIcons.find(i => i.name === storedCat.iconName)?.component || Shapes,
});

// Default categories if nothing in localStorage (should match initialCategoriesData in categories/page.tsx)
const defaultPageCategoriesData: StoredCategory[] = [
  { id: "1", name: "Food & Dining", iconName: "Utensils", color: "hsl(30, 80%, 60%)" },
  { id: "2", name: "Transportation", iconName: "Car", color: "hsl(200, 70%, 60%)" },
  { id: "3", name: "Shopping", iconName: "Shirt", color: "hsl(300, 60%, 60%)" },
  { id: "4", name: "Housing", iconName: "Home", color: "hsl(120, 50%, 50%)" },
  { id: "5", name: "Gifts", iconName: "Gift", color: "hsl(0, 70%, 65%)" },
];


export default function ExpensesPage() {
  const [expenses, setExpenses] = React.useState<Expense[]>(() => {
    if (typeof window !== 'undefined') {
      const storedExpenses = localStorage.getItem(APP_EXPENSES_STORAGE_KEY);
      if (storedExpenses) {
        try {
          return JSON.parse(storedExpenses);
        } catch (e) {
          console.error("Failed to parse expenses from localStorage", e);
        }
      }
    }
    return []; // Initialize with an empty array
  });
  const [pageCategories, setPageCategories] = React.useState<Category[]>(() => defaultPageCategoriesData.map(mapStoredToCategory));
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(APP_EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
      window.dispatchEvent(new CustomEvent('localStorageUpdated', { detail: { key: APP_EXPENSES_STORAGE_KEY } }));
    }
  }, [expenses]);

  React.useEffect(() => {
    const loadCategories = () => {
      if (typeof window === 'undefined') return;
      const storedCategoriesRaw = localStorage.getItem(APP_CATEGORIES_STORAGE_KEY);
      if (storedCategoriesRaw) {
        try {
          const storedCategories: StoredCategory[] = JSON.parse(storedCategoriesRaw);
          setPageCategories(storedCategories.map(mapStoredToCategory));
        } catch (e) {
          console.error("Failed to parse categories from localStorage for expenses page", e);
          setPageCategories(defaultPageCategoriesData.map(mapStoredToCategory));
        }
      } else {
         setPageCategories(defaultPageCategoriesData.map(mapStoredToCategory));
      }
    };

    loadCategories(); // Load on mount

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === APP_CATEGORIES_STORAGE_KEY || event.key === APP_EXPENSES_STORAGE_KEY) {
        loadCategories();
      }
    };
    
    const handleLocalStorageUpdated = (event: CustomEvent) => {
        if (event.detail?.key === APP_CATEGORIES_STORAGE_KEY || event.detail?.key === APP_EXPENSES_STORAGE_KEY) {
            loadCategories();
        }
    };

    window.addEventListener('storage', handleStorageChange); 
    window.addEventListener('localStorageUpdated', handleLocalStorageUpdated as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdated', handleLocalStorageUpdated as EventListener);
    };
  }, []);


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

  const getCategoryDetails = (categoryName: string): Category | undefined => {
    return pageCategories.find(cat => cat.name === categoryName);
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
              {expenses.map((exp) => {
                const categoryDetails = getCategoryDetails(exp.category);
                const IconCmp = categoryDetails?.icon || Shapes; 
                return (
                  <TableRow key={exp.id}>
                    <TableCell>{new Date(exp.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        style={categoryDetails?.color ? { borderColor: categoryDetails.color, color: categoryDetails.color } : {}}
                        className="flex items-center gap-1.5"
                      >
                        <IconCmp className="h-3.5 w-3.5" style={categoryDetails?.color ? { color: categoryDetails.color } : {}}/>
                        {exp.category}
                      </Badge>
                    </TableCell>
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
                );
              })}
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
                disabled={pageCategories.length === 0}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pageCategories.length === 0 && <option disabled value="">No categories available. Please add a category first.</option>}
                {pageCategories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="description" className="mb-1 block">Description</Label>
              <Textarea id="description" name="description" defaultValue={editingExpense?.description} placeholder="e.g., Lunch with colleagues" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={pageCategories.length === 0}>Save Expense</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

