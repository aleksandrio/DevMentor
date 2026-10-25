import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center text-sm"
    >
      <p className="font-medium">{title}</p>
      {description && <p className="text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}
