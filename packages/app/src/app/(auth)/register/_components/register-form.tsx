"use client";

import { useRouter } from "next/navigation";
import { apiCall } from "@devmentor/ui/backend/api/api-call";
import { CrudForm } from "@devmentor/ui/backend/forms/crud-form";
import { registerSchema } from "@devmentor/core/validators/auth/register.schema";
import { useReturnTo } from "../../_components/use-return-to";

export function RegisterForm() {
  const router = useRouter();
  const returnTo = useReturnTo();
  return (
    <CrudForm
      schema={registerSchema}
      fields={[
        { name: "displayName", label: "Imię lub nazwa", autoComplete: "name" },
        { name: "email", label: "E-mail", type: "email", autoComplete: "email" },
        {
          name: "password",
          label: "Hasło",
          type: "password",
          autoComplete: "new-password",
          description: "Co najmniej 8 znaków.",
        },
      ]}
      submitLabel="Załóż konto"
      pendingLabel="Zakładanie konta…"
      onSubmit={(values) => apiCall("/api/auth/register", { method: "POST", body: values })}
      onSuccess={() => {
        router.push(returnTo);
        router.refresh();
      }}
    />
  );
}
