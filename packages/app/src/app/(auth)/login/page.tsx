import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = { title: "Logowanie · DevMentor" };

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Zaloguj się</h1>
      {/* useSearchParams (return path) needs a Suspense boundary on a static page. */}
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Nie masz konta?{" "}
        <Link href="/register" className="font-medium text-zinc-950 underline dark:text-zinc-50">
          Załóż konto
        </Link>
      </p>
    </div>
  );
}
