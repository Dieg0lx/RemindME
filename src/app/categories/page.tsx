
"use client";

import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Edit, PlusCircle, Shapes, Trash2, Utensils, Car, Shirt, Home, Gift } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { APP_LOGGED_IN_USER_KEY, getUserSpecificKey } from "@/lib/storageKeys";
import { useRouter } from "next/navigation";

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

const APP_CATEGORIES_STORAGE_KEY_BASE = "remindme_categories";

const initialCategoriesData: Omit<Category, 'icon'> & { iconName: string }[] = [
  { id: "1", name: "Comida y Cena", iconName: "Utensils", color: "hsl(30, 80%, 60%)" },
  { id: "2", name: "Transporte", iconName: "Car", color: "hsl(200, 70%, 60%)" },
  { id: "3", name: "Vivienda", iconName: "Home", color: "hsl(120, 50%, 50%)" },
];

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

const mapCategoryToStored = (cat: Category): StoredCategory => ({
  ...cat,
  iconName: availableIcons.find(i => i.component === cat.icon)?.name || "Shapes",
});

export default function CategoriesPage() {
  const router = useRouter();
  const [currentUserEmail, setCurrentUserEmail] = React.useState<string | null>(null);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);

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

  React.useEffect(() => {
    if (typeof window !== 'undefined' && currentUserEmail) {
      const userCategoriesKey = getUserSpecificKey(APP_CATEGORIES_STORAGE_KEY_BASE, currentUserEmail);
      const storedCategoriesRaw = localStorage.getItem(userCategoriesKey);
      if (storedCategoriesRaw) {
        try {
          const storedCategories: StoredCategory[] = JSON.parse(storedCategoriesRaw);
          setCategories(storedCategories.map(mapStoredToCategory));
        } catch (e) {
          console.error("Failed to parse categories from localStorage", e);
          setCategories(initialCategoriesData.map(data => ({
            ...data,
            icon: availableIcons.find(i => i.name === data.iconName)?.component || Shapes,
          })));
        }
      } else {
        setCategories(initialCategoriesData.map(data => ({
          ...data,
          icon: availableIcons.find(i => i.name === data.iconName)?.component || Shapes,
        })));
      }
    } else if (typeof window !== 'undefined' && !currentUserEmail) {
        setCategories([]); // Clear if no user
    }
  }, [currentUserEmail]);


  React.useEffect(() => {
    if (typeof window !== 'undefined' && currentUserEmail) {
      const userCategoriesKey = getUserSpecificKey(APP_CATEGORIES_STORAGE_KEY_BASE, currentUserEmail);
      const storedCategories = categories.map(mapCategoryToStored);
      localStorage.setItem(userCategoriesKey, JSON.stringify(storedCategories));
      window.dispatchEvent(new CustomEvent('localStorageUpdated', { detail: { key: userCategoriesKey } }));
    }
  }, [categories, currentUserEmail]);


  const handleOpenDialog = (category?: Category) => {
    setEditingCategory(category || null);
    setIsDialogOpen(true);
  };

  const handleSaveCategory = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const selectedIconName = formData.get("icon") as string;
    const selectedIcon = availableIcons.find(i => i.name === selectedIconName)?.component || Shapes;

    const newCategoryData: Category = {
      id: editingCategory?.id || String(Date.now()),
      name: formData.get("name") as string,
      icon: selectedIcon,
      color: formData.get("color") as string || undefined,
    };

    if (editingCategory) {
      setCategories(cats => cats.map(c => c.id === editingCategory.id ? newCategoryData : c));
    } else {
      setCategories(cats => [...cats, newCategoryData]);
    }
    setIsDialogOpen(false);
    setEditingCategory(null);
  };
  
  const handleDeleteCategory = (id: string) => {
    setCategories(cats => cats.filter(c => c.id !== id));
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
        title="Categorías de Gastos"
        actionButtonText="Agregar Categoría"
        ActionIcon={PlusCircle}
        onActionButtonClick={() => handleOpenDialog()}
      />

      {categories.length === 0 && currentUserEmail ? ( // Show empty state if user is loaded but has no categories
        <EmptyState
          IconCmp={Shapes}
          title="No Hay Categorías Definidas"
          description="Crea categorías para organizar tus gastos de forma eficaz."
          actionButtonText="Agregar Primera Categoría"
          onActionButtonClick={() => handleOpenDialog()}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((cat) => {
            const IconCmp = cat.icon;
            return (
              <Card key={cat.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                     <CardTitle className="text-lg">{cat.name}</CardTitle>
                     <IconCmp className="h-6 w-6 text-muted-foreground" style={{color: cat.color}} />
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Content can be added here if needed */}
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(cat)}>
                    <Edit className="mr-1 h-4 w-4" /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(cat.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Editar" : "Agregar"} Categoría</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Actualiza los detalles de la categoría." : "Crea una nueva categoría para tus gastos."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <Label htmlFor="name" className="mb-1 block">Nombre de la Categoría</Label>
              <Input id="name" name="name" defaultValue={editingCategory?.name} required />
            </div>
            <div>
              <Label htmlFor="icon" className="mb-1 block">Ícono</Label>
              <select 
                id="icon" 
                name="icon" 
                defaultValue={availableIcons.find(i => i.component === editingCategory?.icon)?.name || "Shapes"} 
                required
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {availableIcons.map(icon => (
                  <option key={icon.name} value={icon.name}>{icon.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="color" className="mb-1 block">Color (Opcional)</Label>
              <Input id="color" name="color" type="color" defaultValue={editingCategory?.color || '#cccccc'} className="h-10 p-1"/>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar Categoría</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
