"use client";

import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Edit, PlusCircle, Shapes, Trash2, Utensils, Car, Shirt, Home, Gift } from "lucide-react"; // Example icons
import type { LucideIcon } from "lucide-react";


interface Category {
  id: string;
  name: string;
  icon: LucideIcon; 
  color?: string; // Optional color for the category badge/icon
}

const initialCategories: Category[] = [
  { id: "1", name: "Food & Dining", icon: Utensils, color: "hsl(30, 80%, 60%)" },
  { id: "2", name: "Transportation", icon: Car, color: "hsl(200, 70%, 60%)" },
  { id: "3", name: "Shopping", icon: Shirt, color: "hsl(300, 60%, 60%)" },
  { id: "4", name: "Housing", icon: Home, color: "hsl(120, 50%, 50%)" },
  { id: "5", name: "Gifts", icon: Gift, color: "hsl(0, 70%, 65%)" },
];

const availableIcons: { name: string; component: LucideIcon }[] = [
    { name: "Utensils", component: Utensils },
    { name: "Car", component: Car },
    { name: "Shirt", component: Shirt },
    { name: "Home", component: Home },
    { name: "Gift", component: Gift },
    { name: "Shapes", component: Shapes }, // Default
];

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>(initialCategories);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);

  const handleOpenDialog = (category?: Category) => {
    setEditingCategory(category || null);
    setIsDialogOpen(true);
  };

  const handleSaveCategory = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const selectedIconName = formData.get("icon") as string;
    const selectedIcon = availableIcons.find(i => i.name === selectedIconName)?.component || Shapes;

    const newCategory: Category = {
      id: editingCategory?.id || String(Date.now()),
      name: formData.get("name") as string,
      icon: selectedIcon,
      color: formData.get("color") as string || undefined,
    };

    if (editingCategory) {
      setCategories(cats => cats.map(c => c.id === editingCategory.id ? newCategory : c));
    } else {
      setCategories(cats => [...cats, newCategory]);
    }
    setIsDialogOpen(false);
    setEditingCategory(null);
  };
  
  const handleDeleteCategory = (id: string) => {
    setCategories(cats => cats.filter(c => c.id !== id));
  };

  return (
    <AppLayout>
      <PageHeader
        title="Expense Categories"
        actionButtonText="Add Category"
        ActionIcon={PlusCircle}
        onActionButtonClick={() => handleOpenDialog()}
      />

      {categories.length === 0 ? (
        <EmptyState
          IconCmp={Shapes}
          title="No Categories Defined"
          description="Create categories to organize your expenses effectively."
          actionButtonText="Add First Category"
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
                  <p className="text-sm text-muted-foreground">Used in X expenses this month.</p> {/* Placeholder */}
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(cat)}>
                    <Edit className="mr-1 h-4 w-4" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(cat.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="mr-1 h-4 w-4" /> Delete
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
            <DialogTitle>{editingCategory ? "Edit" : "Add"} Category</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Update the category details." : "Create a new category for your expenses."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <Label htmlFor="name" className="mb-1 block">Category Name</Label>
              <Input id="name" name="name" defaultValue={editingCategory?.name} required />
            </div>
            <div>
              <Label htmlFor="icon" className="mb-1 block">Icon</Label>
              {/* In a real app, use Select component here */}
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
              <Label htmlFor="color" className="mb-1 block">Color (Optional)</Label>
              <Input id="color" name="color" type="color" defaultValue={editingCategory?.color || '#cccccc'} className="h-10 p-1"/>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Category</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
