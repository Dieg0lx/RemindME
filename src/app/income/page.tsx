
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
import { Edit, Banknote, PlusCircle, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface IncomeTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  source?: string; // Optional: e.g., Salary, Freelance
}

const APP_INCOME_STORAGE_KEY = "remindme_income_transactions";

export default function IncomePage() {
  const [incomeTransactions, setIncomeTransactions] = React.useState<IncomeTransaction[]>(() => {
    if (typeof window !== 'undefined') {
      const storedIncome = localStorage.getItem(APP_INCOME_STORAGE_KEY);
      if (storedIncome) {
        try {
          return JSON.parse(storedIncome);
        } catch (e) {
          console.error("Failed to parse income transactions from localStorage", e);
        }
      }
    }
    return []; 
  });

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<IncomeTransaction | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(APP_INCOME_STORAGE_KEY, JSON.stringify(incomeTransactions));
      window.dispatchEvent(new CustomEvent('localStorageUpdated', { detail: { key: APP_INCOME_STORAGE_KEY } }));
    }
  }, [incomeTransactions]);

  const handleOpenDialog = (transaction?: IncomeTransaction) => {
    setEditingTransaction(transaction || null);
    setIsDialogOpen(true);
  };

  const handleSaveTransaction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newTransaction: IncomeTransaction = {
      id: editingTransaction?.id || String(Date.now()),
      date: formData.get("date") as string,
      description: formData.get("description") as string,
      amount: parseFloat(formData.get("amount") as string),
      source: formData.get("source") as string || undefined,
    };

    if (editingTransaction) {
      setIncomeTransactions(txns => txns.map(t => t.id === editingTransaction.id ? newTransaction : t));
    } else {
      setIncomeTransactions(txns => [...txns, newTransaction].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
    setIsDialogOpen(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setIncomeTransactions(txns => txns.filter(t => t.id !== id));
  };

  return (
    <AppLayout>
      <PageHeader
        title="Ingresos"
        actionButtonText="Agregar Ingreso"
        ActionIcon={PlusCircle}
        onActionButtonClick={() => handleOpenDialog()}
      />

      {incomeTransactions.length === 0 ? (
        <EmptyState
          IconCmp={Banknote}
          title="No Hay Ingresos Registrados"
          description="Comienza a registrar tus ingresos para tener una mejor visión de tus finanzas."
          actionButtonText="Agregar Primer Ingreso"
          onActionButtonClick={() => handleOpenDialog()}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Fuente</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomeTransactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell>{new Date(txn.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{txn.description}</TableCell>
                  <TableCell>{txn.source || "N/A"}</TableCell>
                  <TableCell className="text-right">${txn.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(txn)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteTransaction(txn.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
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
            <DialogTitle>{editingTransaction ? "Editar" : "Agregar"} Ingreso</DialogTitle>
            <DialogDescription>
              {editingTransaction ? "Actualiza los detalles de tu ingreso." : "Ingresa los detalles para el nuevo ingreso."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveTransaction} className="space-y-4">
            <div>
              <Label htmlFor="date" className="mb-1 block">Fecha</Label>
              <Input id="date" name="date" type="date" defaultValue={editingTransaction?.date || new Date().toISOString().split('T')[0]} required />
            </div>
            <div>
              <Label htmlFor="amount" className="mb-1 block">Monto ($)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingTransaction?.amount} placeholder="0.00" required />
            </div>
            <div>
              <Label htmlFor="description" className="mb-1 block">Descripción</Label>
              <Textarea id="description" name="description" defaultValue={editingTransaction?.description} placeholder="Ej: Salario mensual" required/>
            </div>
            <div>
              <Label htmlFor="source" className="mb-1 block">Fuente (Opcional)</Label>
              <Input id="source" name="source" defaultValue={editingTransaction?.source} placeholder="Ej: Empresa X, Proyecto Freelance Y" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar Ingreso</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

