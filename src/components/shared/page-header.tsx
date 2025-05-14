import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  actionButtonText?: string;
  onActionButtonClick?: () => void;
  ActionIcon?: LucideIcon;
  children?: React.ReactNode;
}

export function PageHeader({ title, actionButtonText, onActionButtonClick, ActionIcon, children }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
      <div className="flex items-center gap-2">
        {children}
        {actionButtonText && onActionButtonClick && (
          <Button onClick={onActionButtonClick} className="shadow-sm">
            {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
            {actionButtonText}
          </Button>
        )}
      </div>
    </div>
  );
}
