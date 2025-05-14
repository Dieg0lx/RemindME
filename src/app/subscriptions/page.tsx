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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Edit, PlusCircle, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: "Monthly" | "Yearly" | "Quarterly";
  nextDueDate: string;
  status: "Active" | "Paused" | "Cancelled";
}

const initialSubscriptions: Subscription[] = [
  { id: "1", name: "Netflix Premium", amount: 19.99, cycle: "Monthly", nextDueDate: "2024-08-15", status: "Active" },
  { id: "2", name: "Spotify Family", amount: 16.99, cycle: "Monthly", nextDueDate: "2024-08-20", status: "Active" },
  { id: "3", name: "Adobe Creative Cloud", amount: 599.88, cycle: "Yearly", nextDueDate: "2025-01-10", status: "Active" },
  { id: "4", name: "Gym Membership", amount: 45.00, cycle: "Monthly", nextDueDate: "2024-08-01", status: "Paused" },
];

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>(initialSubscriptions);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingSubscription, setEditingSubscription] = React.useState<Subscription | null>(null);

  const handleOpenDialog = (subscription?: Subscription) => {
    setEditingSubscription(subscription || null);
    setIsDialogOpen(true);
  };

  const handleSaveSubscription = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newSubscription = {
      id: editingSubscription?.id || String(Date.now()),
      name: formData.get("name") as string,
      amount: parseFloat(formData.get("amount") as string),
      cycle: formData.get("cycle") as Subscription["cycle"],
      nextDueDate: formData.get("nextDueDate") as string,
      status: "Active", // Default status
    };

    if (editingSubscription) {
      setSubscriptions(subs => subs.map(s => s.id === editingSubscription.id ? newSubscription : s));
    } else {
      setSubscriptions(subs => [...subs, newSubscription]);
    }
    setIsDialogOpen(false);
    setEditingSubscription(null);
  };
  
  const handleDeleteSubscription = (id: string) => {
    setSubscriptions(subs => subs.filter(s => s.id !== id));
  };


  return (
    <AppLayout>
      <PageHeader
        title="Subscriptions"
        actionButtonText="Add Subscription"
        ActionIcon={PlusCircle}
        onActionButtonClick={() => handleOpenDialog()}
      />

      {subscriptions.length === 0 ? (
        <EmptyState
          IconCmp={CreditCard}
          title="No Subscriptions Yet"
          description="Add your recurring subscriptions to keep track of them."
          actionButtonText="Add First Subscription"
          onActionButtonClick={() => handleOpenDialog()}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Billing Cycle</TableHead>
                <TableHead>Next Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.name}</TableCell>
                  <TableCell className="text-right">${sub.amount.toFixed(2)}</TableCell>
                  <TableCell>{sub.cycle}</TableCell>
                  <TableCell>{sub.nextDueDate}</TableCell>
                  <TableCell>
                    <Badge variant={sub.status === "Active" ? "default" : sub.status === "Paused" ? "secondary" : "destructive"} className="capitalize">
                      {sub.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(sub)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteSubscription(sub.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
            <DialogTitle>{editingSubscription ? "Edit" : "Add"} Subscription</DialogTitle>
            <DialogDescription>
              {editingSubscription ? "Update the details of your subscription." : "Enter the details for the new subscription."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveSubscription} className="space-y-4">
            <div>
              <Label htmlFor="name" className="mb-1 block">Name</Label>
              <Input id="name" name="name" defaultValue={editingSubscription?.name} required />
            </div>
            <div>
              <Label htmlFor="amount" className="mb-1 block">Amount ($)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingSubscription?.amount} required />
            </div>
            <div>
              <Label htmlFor="cycle" className="mb-1 block">Billing Cycle</Label>
              {/* In a real app, use Select component here */}
              <Input id="cycle" name="cycle" list="cycles" defaultValue={editingSubscription?.cycle} required />
              <datalist id="cycles">
                <option value="Monthly" />
                <option value="Yearly" />
                <option value="Quarterly" />
              </datalist>
            </div>
            <div>
              <Label htmlFor="nextDueDate" className="mb-1 block">Next Due Date</Label>
              <Input id="nextDueDate" name="nextDueDate" type="date" defaultValue={editingSubscription?.nextDueDate} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Subscription</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
