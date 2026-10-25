import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RegisterForm } from "./_components/register-form";

export const metadata: Metadata = { title: "Rejestracja · DevMentor" };

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Załóż konto</h1>
      {/* useSearchParams (return path) needs a Suspense boundary on a static page. */}
      <Suspense>
        <RegisterForm />
      </Suspense>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Masz już konto?{" "}
        <Link href="/login" className="font-medium text-zinc-950 underline dark:text-zinc-50">
          Zaloguj się
        </Link>
      </p>
    </div>
  );
}
