"use client";

import { useRouter } from "next/navigation";
import { apiCall } from "@devmentor/ui/backend/api/api-call";
import { CrudForm } from "@devmentor/ui/backend/forms/crud-form";
import { loginSchema } from "@devmentor/core/validators/auth/login.schema";
import { useReturnTo } from "../../_components/use-return-to";

export function LoginForm() {
  const router = useRouter();
  const returnTo = useReturnTo();
  return (
    <CrudForm
      schema={loginSchema}
      fields={[
        { name: "email", label: "E-mail", type: "email", autoComplete: "email" },
        { name: "password", label: "Hasło", type: "password", autoComplete: "current-password" },
      ]}
      submitLabel="Zaloguj się"
      pendingLabel="Logowanie…"
      onSubmit={(values) => apiCall("/api/auth/login", { method: "POST", body: values })}
      onSuccess={() => {
        router.push(returnTo);
        router.refresh();
      }}
    />
  );
}
