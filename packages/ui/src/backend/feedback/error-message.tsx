import { Button } from "@devmentor/ui/components/ui/button";

interface ErrorMessageProps {
  title?: string;
  message: string;
  /** Renders a retry button; only from client components. */
  onRetry?: () => void;
}

export function ErrorMessage({ title = "Coś poszło nie tak", message, onRetry }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      data-slot="error-message"
      className="flex flex-col items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm"
    >
      <p className="font-medium text-destructive">{title}</p>
      <p className="text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Spróbuj ponownie
        </Button>
      )}
    </div>
  );
}
