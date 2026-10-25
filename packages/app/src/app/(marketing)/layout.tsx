import Link from "next/link";

// Public pages for learners and mentors, styled with Tailwind utilities.
export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="border-b border-black/[.08] bg-white dark:border-white/[.145] dark:bg-black">
        <nav className="mx-auto flex h-14 w-full max-w-3xl items-center justify-end gap-4 px-6 text-sm font-medium">
          <Link href="/login" className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50">
            Zaloguj się
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-foreground px-4 py-1.5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Załóż konto
          </Link>
        </nav>
      </header>
      {children}
    </>
  );
}
