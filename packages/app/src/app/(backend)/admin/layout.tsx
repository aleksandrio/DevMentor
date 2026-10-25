import type { Metadata } from "next";
import Link from "next/link";
import { LogoutButton } from "./_components/logout-button";

// Back-office pages are built from shadcn/ui components in @devmentor/ui.

export const metadata: Metadata = {
  title: "Panel administracyjny · DevMentor",
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
          <Link href="/admin" className="font-heading text-sm font-semibold">
            DevMentor · Admin
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/admin/users"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Użytkownicy
            </Link>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Strona główna
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
