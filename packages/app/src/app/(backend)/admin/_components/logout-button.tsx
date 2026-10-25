"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiCall } from "@devmentor/ui/backend/api/api-call";
import { Button } from "@devmentor/ui/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function logout() {
    setIsPending(true);
    await apiCall("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" disabled={isPending} onClick={logout}>
      Wyloguj
    </Button>
  );
}
