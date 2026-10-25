import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@devmentor/ui/components/ui/card";
import { getSession } from "@/server/session";
import { UsersTable } from "./_components/users-table";

export const metadata: Metadata = { title: "Użytkownicy · Panel administracyjny" };

// Reads the session cookie on every request (engineering standards: force-dynamic).
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/admin/users");
  }
  if (session.role !== "admin") {
    return (
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Brak uprawnień</CardTitle>
          <CardDescription>Ta strona jest dostępna tylko dla administratorów.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Użytkownicy</CardTitle>
        <CardDescription>Lista kont. Dane pochodzą z /api/users.</CardDescription>
      </CardHeader>
      <CardContent>
        <UsersTable />
      </CardContent>
    </Card>
  );
}
