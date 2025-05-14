
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
import { APP_LOGGED_IN_USER_KEY, getUserSpecificKey } from "@/lib/storageKeys";
import { useRouter } from "next/navigation";

interface Expense {
  id: string;
  date: string;
  category: string; // Category name
  description: string;
  amount: number;
}

interface StoredCategory {
  id: string;
  name: string;
  iconName: string;
  color?: string;
}

interface Category {
  id: string;
  name: string;
  icon: LucideIcon; 
  color?: string;
}

const APP_EXPENSES_STORAGE_KEY_BASE = "remindme_expenses";
const APP_CATEGORIES_STORAGE_KEY_BASE = "remindme_categories"; // For reading categories

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

export default function ExpensesPage() {
  const router = useRouter();
  const [currentUserEmail, setCurrentUserEmail] = React.useState<string | null>(null);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [pageCategories, setPageCategories] = React.useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedInUserRaw = localStorage.getItem(APP_LOGGED_IN_USER_KEY);
      if (loggedInUserRaw) {
        try {
          const loggedInUser = JSON.parse(loggedInUserRaw);
          setCurrentUserEmail(loggedInUser.email);
        } catch (e) {
          console.error("Failed to parse logged in user", e);
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    }
  }, [router]);

  // Load expenses for the current user
  React.useEffect(() => {
    if (typeof window !== 'undefined' && currentUserEmail) {
      const userExpensesKey = getUserSpecificKey(APP_EXPENSES_STORAGE_KEY_BASE, currentUserEmail);
      const storedExpenses = localStorage.getItem(userExpensesKey);
      if (storedExpenses) {
        try {
          setExpenses(JSON.parse(storedExpenses));
        } catch (e) {
          console.error("Failed to parse expenses from localStorage", e);
          setExpenses([]); // Fallback to empty
        }
      } else {
        setExpenses([]); // No expenses for this user yet
      }
    } else if (typeof window !== 'undefined' && !currentUserEmail) {
        setExpenses([]);
    }
  }, [currentUserEmail]);

  // Save expenses for the current user
  React.useEffect(() => {
    if (typeof window !== 'undefined' && currentUserEmail) {
      const userExpensesKey = getUserSpecificKey(APP_EXPENSES_STORAGE_KEY_BASE, currentUserEmail);
      localStorage.setItem(userExpensesKey, JSON.stringify(expenses));
      window.dispatchEvent(new CustomEvent('localStorageUpdated', { detail: { key: userExpensesKey } }));
    }
  }, [expenses, currentUserEmail]);

  // Load categories for the current user
  React.useEffect(() => {
    const loadCategories = () => {
      if (typeof window === 'undefined' || !currentUserEmail) {
        setPageCategories([]);
        return;
      }
      const userCategoriesKey = getUserSpecificKey(APP_CATEGORIES_STORAGE_KEY_BASE, currentUserEmail);
      const storedCategoriesRaw = localStorage.getItem(userCategoriesKey);
      if (storedCategoriesRaw) {
        try {
          const storedCategories: StoredCategory[] = JSON.parse(storedCategoriesRaw);
          setPageCategories(storedCategories.map(mapStoredToCategory));
        } catch (e) {
          console.error("Failed to parse categories from localStorage for expenses page", e);
          setPageCategories([]); // Fallback to empty
        }
      } else {
         setPageCategories([]); // No categories defined for this user yet
      }
    };

    loadCategories();

    const handleStorageChange = (event: StorageEvent) => {
      if (currentUserEmail) {
        const userCatKey = getUserSpecificKey(APP_CATEGORIES_STORAGE_KEY_BASE, currentUserEmail);
        // const userExpKey = getUserSpecificKey(APP_EXPENSES_STORAGE_KEY_BASE, currentUserEmail);
        if (event.key === userCatKey /*|| event.key === userExpKey */) { // We only need to reload categories if they change
          loadCategories();
        }
      }
    };
    
    const handleLocalStorageUpdated = (event: CustomEvent) => {
      if (currentUserEmail) {
        const userCatKey = getUserSpecificKey(APP_CATEGORIES_STORAGE_KEY_BASE, currentUserEmail);
        // const userExpKey = getUserSpecificKey(APP_EXPENSES_STORAGE_KEY_BASE, currentUserEmail);
        if (event.detail?.key === userCatKey /*|| event.detail?.key === userExpKey */) {
            loadCategories();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange); 
    window.addEventListener('localStorageUpdated', handleLocalStorageUpdated as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdated', handleLocalStorageUpdated as EventListener);
    };
  }, [currentUserEmail]);


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

  if (!currentUserEmail) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center">
          <p>Cargando datos del usuario...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Gastos"
        actionButtonText="Agregar Gasto"
        ActionIcon={PlusCircle}
        onActionButtonClick={() => handleOpenDialog()}
      />

      {expenses.length === 0 ? (
        <EmptyState
          IconCmp={ListChecks}
          title="No Hay Gastos Registrados"
          description="Comienza a registrar tus gastos para tener una mejor visión de tus finanzas."
          actionButtonText="Agregar Primer Gasto"
          onActionButtonClick={() => handleOpenDialog()}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((exp) => {
                const categoryDetails = getCategoryDetails(exp.category);
                const IconCmp = categoryDetails?.icon || Shapes; 
                return (
                  <TableRow key={exp.id}>
                    <TableCell>{new Date(exp.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</TableCell>
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
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(exp)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteExpense(exp.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
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
            <DialogTitle>{editingExpense ? "Editar" : "Agregar"} Gasto</DialogTitle>
            <DialogDescription>
              {editingExpense ? "Actualiza los detalles de tu gasto." : "Ingresa los detalles para el nuevo gasto."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveExpense} className="space-y-4">
            <div>
              <Label htmlFor="date" className="mb-1 block">Fecha</Label>
              <Input id="date" name="date" type="date" defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]} required />
            </div>
            <div>
              <Label htmlFor="amount" className="mb-1 block">Monto ($)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingExpense?.amount} placeholder="0.00" required />
            </div>
             <div>
              <Label htmlFor="category" className="mb-1 block">Categoría</Label>
              <select 
                id="category" 
                name="category" 
                defaultValue={editingExpense?.category || (pageCategories.length > 0 ? pageCategories[0].name : "")} 
                required
                disabled={pageCategories.length === 0}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pageCategories.length === 0 && <option disabled value="">No hay categorías. Agregue una en la sección 'Categorías'.</option>}
                {pageCategories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
               {pageCategories.length === 0 && <p className="mt-1 text-xs text-muted-foreground">Por favor, primero crea categorías en la sección 'Categorías'.</p>}
            </div>
            <div>
              <Label htmlFor="description" className="mb-1 block">Descripción</Label>
              <Textarea id="description" name="description" defaultValue={editingExpense?.description} placeholder="Ej: Almuerzo con colegas" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={pageCategories.length === 0}>Guardar Gasto</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
