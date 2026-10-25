import Link from "next/link";

// Login and registration: public pages styled with Tailwind utilities.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <Link href="/" className="mb-8 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        DevMentor
      </Link>
      <main className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
        {children}
      </main>
    </div>
  );
}
