import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  IconCmp: LucideIcon; // Renamed to avoid conflict with Icon type from other libraries
  title: string;
  description: string;
  actionButtonText?: string;
  onActionButtonClick?: () => void;
}

export function EmptyState({ IconCmp, title, description, actionButtonText, onActionButtonClick }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center shadow-sm sm:p-12">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <IconCmp className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="mb-6 mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {actionButtonText && onActionButtonClick && (
        <Button onClick={onActionButtonClick} className="shadow-sm">
          {actionButtonText}
        </Button>
      )}
    </div>
  );
}
