
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
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Edit, 
  PlusCircle, 
  Trash2, 
  MoreHorizontal,
  CheckCircle,
  PauseCircle,
  XCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_LOGGED_IN_USER_KEY, getUserSpecificKey } from "@/lib/storageKeys";
import { useRouter } from "next/navigation";

interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: "Mensual" | "Anual" | "Trimestral";
  nextDueDate: string;
  status: "Activa" | "Pausada" | "Cancelada";
}

const APP_SUBSCRIPTIONS_STORAGE_KEY_BASE = "remindme_subscriptions";

const initialSubscriptionsData: Subscription[] = [
  { id: "1", name: "Netflix Premium", amount: 19.99, cycle: "Mensual", nextDueDate: "2024-08-15", status: "Activa" },
  { id: "2", name: "Spotify Family", amount: 16.99, cycle: "Mensual", nextDueDate: "2024-08-20", status: "Activa" },
  { id: "3", name: "Adobe Creative Cloud", amount: 599.88, cycle: "Anual", nextDueDate: "2025-01-10", status: "Activa" },
];

const subscriptionCycles: Subscription["cycle"][] = ["Mensual", "Anual", "Trimestral"];
const subscriptionStatuses: Subscription["status"][] = ["Activa", "Pausada", "Cancelada"];

export default function SubscriptionsPage() {
  const router = useRouter();
  const [currentUserEmail, setCurrentUserEmail] = React.useState<string | null>(null);
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingSubscription, setEditingSubscription] = React.useState<Subscription | null>(null);

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

  // Load subscriptions for the current user
  React.useEffect(() => {
    if (typeof window !== 'undefined' && currentUserEmail) {
      const userSubscriptionsKey = getUserSpecificKey(APP_SUBSCRIPTIONS_STORAGE_KEY_BASE, currentUserEmail);
      const storedSubscriptions = localStorage.getItem(userSubscriptionsKey);
      if (storedSubscriptions) {
        try {
          setSubscriptions(JSON.parse(storedSubscriptions));
        } catch (e) {
          console.error("Failed to parse subscriptions from localStorage", e);
          setSubscriptions(initialSubscriptionsData); // Fallback to initial
        }
      } else {
        setSubscriptions(initialSubscriptionsData); // Seed initial for new user
      }
    } else if (typeof window !== 'undefined' && !currentUserEmail) {
        setSubscriptions([]);
    }
  }, [currentUserEmail]);

  // Save subscriptions for the current user
  React.useEffect(() => {
    if (typeof window !== 'undefined' && currentUserEmail) {
      const userSubscriptionsKey = getUserSpecificKey(APP_SUBSCRIPTIONS_STORAGE_KEY_BASE, currentUserEmail);
      localStorage.setItem(userSubscriptionsKey, JSON.stringify(subscriptions));
      window.dispatchEvent(new CustomEvent('localStorageUpdated', { detail: { key: userSubscriptionsKey } }));
    }
  }, [subscriptions, currentUserEmail]);


  const handleOpenDialog = (subscription?: Subscription) => {
    setEditingSubscription(subscription || null);
    setIsDialogOpen(true);
  };

  const handleSaveSubscription = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newSubscription: Subscription = {
      id: editingSubscription?.id || String(Date.now()),
      name: formData.get("name") as string,
      amount: parseFloat(formData.get("amount") as string),
      cycle: formData.get("cycle") as Subscription["cycle"],
      nextDueDate: formData.get("nextDueDate") as string,
      status: formData.get("status") as Subscription["status"],
    };

    if (editingSubscription) {
      setSubscriptions(subs => subs.map(s => (s.id === editingSubscription.id ? newSubscription : s)));
    } else {
      setSubscriptions(subs => [...subs, newSubscription].sort((a,b) => new Date(b.nextDueDate).getTime() - new Date(a.nextDueDate).getTime()));
    }
    setIsDialogOpen(false);
    setEditingSubscription(null);
  };
  
  const handleDeleteSubscription = (id: string) => {
    setSubscriptions(subs => subs.filter(s => s.id !== id));
  };

  const handleChangeStatus = (id: string, newStatus: Subscription['status']) => {
    setSubscriptions(subs =>
      subs.map(s => (s.id === id ? { ...s, status: newStatus } : s))
    );
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
        title="Suscripciones"
        actionButtonText="Agregar Suscripción"
        ActionIcon={PlusCircle}
        onActionButtonClick={() => handleOpenDialog()}
      />

      {subscriptions.length === 0 && currentUserEmail ? (
        <EmptyState
          IconCmp={CreditCard}
          title="Aún No Hay Suscripciones"
          description="Agrega tus suscripciones recurrentes para llevar un seguimiento."
          actionButtonText="Agregar Primera Suscripción"
          onActionButtonClick={() => handleOpenDialog()}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Ciclo de Facturación</TableHead>
                <TableHead>Próximo Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.name}</TableCell>
                  <TableCell className="text-right">${sub.amount.toFixed(2)}</TableCell>
                  <TableCell>{sub.cycle}</TableCell>
                  <TableCell>{new Date(sub.nextDueDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={sub.status === "Activa" ? "default" : sub.status === "Pausada" ? "secondary" : "destructive"} 
                      className="capitalize"
                    >
                      {sub.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(sub)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {sub.status !== "Activa" && (
                          <DropdownMenuItem onClick={() => handleChangeStatus(sub.id, "Activa")}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Activa
                          </DropdownMenuItem>
                        )}
                        {sub.status !== "Pausada" && (
                          <DropdownMenuItem onClick={() => handleChangeStatus(sub.id, "Pausada")}>
                            <PauseCircle className="mr-2 h-4 w-4" /> Marcar como Pausada
                          </DropdownMenuItem>
                        )}
                        {sub.status !== "Cancelada" && (
                          <DropdownMenuItem onClick={() => handleChangeStatus(sub.id, "Cancelada")}>
                            <XCircle className="mr-2 h-4 w-4" /> Marcar como Cancelada
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteSubscription(sub.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
            <DialogTitle>{editingSubscription ? "Editar" : "Agregar"} Suscripción</DialogTitle>
            <DialogDescription>
              {editingSubscription ? "Actualiza los detalles de tu suscripción." : "Ingresa los detalles para la nueva suscripción."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveSubscription} className="space-y-4">
            <div>
              <Label htmlFor="name" className="mb-1 block">Nombre</Label>
              <Input id="name" name="name" defaultValue={editingSubscription?.name} required />
            </div>
            <div>
              <Label htmlFor="amount" className="mb-1 block">Monto ($)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingSubscription?.amount} required />
            </div>
            <div>
              <Label htmlFor="cycle" className="mb-1 block">Ciclo de Facturación</Label>
              <select 
                id="cycle" 
                name="cycle" 
                defaultValue={editingSubscription?.cycle || subscriptionCycles[0]} 
                required
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {subscriptionCycles.map(cycle => (
                  <option key={cycle} value={cycle}>{cycle}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="nextDueDate" className="mb-1 block">Próxima Fecha de Vencimiento</Label>
              <Input id="nextDueDate" name="nextDueDate" type="date" defaultValue={editingSubscription?.nextDueDate || new Date().toISOString().split('T')[0]} required />
            </div>
            <div>
              <Label htmlFor="status" className="mb-1 block">Estado</Label>
              <select 
                id="status" 
                name="status" 
                defaultValue={editingSubscription?.status || subscriptionStatuses[0]} 
                required
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {subscriptionStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar Suscripción</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
