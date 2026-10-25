"use client";

import { useEffect, useState } from "react";
import type { UserDto } from "@devmentor/core";
import { apiCall } from "@devmentor/ui/backend/api/api-call";
import { DataTable, type DataTableColumn } from "@devmentor/ui/backend/tables/data-table";
import { Badge } from "@devmentor/ui/components/ui/badge";

const roleLabels: Record<UserDto["role"], string> = {
  student: "uczeń",
  mentor: "mentor",
  admin: "administrator",
};

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" });

const columns: DataTableColumn<UserDto>[] = [
  { id: "displayName", header: "Nazwa", cell: (user) => user.displayName },
  { id: "email", header: "E-mail", cell: (user) => user.email },
  { id: "role", header: "Rola", cell: (user) => <Badge variant="outline">{roleLabels[user.role]}</Badge> },
  { id: "createdAt", header: "Utworzono", cell: (user) => dateFormat.format(new Date(user.createdAt)) },
];

export function UsersTable() {
  const [users, setUsers] = useState<UserDto[]>();
  const [error, setError] = useState<string | null>(null);

  // Bumped by "retry" to run the effect again.
  const [loadCount, setLoadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    apiCall<UserDto[]>("/api/users", { signal: controller.signal }).then(
      (result) => {
        if (result.ok) {
          setUsers(result.data);
        } else {
          setError(result.error.message);
        }
      },
      () => {
        // apiCall rejects only when aborted, i.e. after unmount or a newer load.
        if (!controller.signal.aborted) {
          setError("Nie udało się wczytać listy użytkowników.");
        }
      },
    );
    return () => controller.abort();
  }, [loadCount]);

  function retry() {
    setError(null);
    setUsers(undefined);
    setLoadCount((count) => count + 1);
  }

  return (
    <DataTable
      columns={columns}
      rows={users}
      getRowId={(user) => user.id}
      error={error}
      onRetry={retry}
      emptyState={{ title: "Brak użytkowników" }}
      caption="Konta zarejestrowane w serwisie"
    />
  );
}
