export function LoadingMessage({ label = "Ładowanie…" }: { label?: string }) {
  return (
    <p role="status" data-slot="loading-message" className="py-6 text-center text-sm text-muted-foreground">
      {label}
    </p>
  );
}
