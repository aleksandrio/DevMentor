import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@devmentor/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@devmentor/ui/components/card";
import {
  DatabaseStatus,
  DatabaseStatusBadge,
} from "./_components/database-status";

// Reads the database on every request (engineering standards: DB access only
// in force-dynamic routes, so the build never needs a database).
export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Panel administracyjny</CardTitle>
        <CardDescription>
          Zaplecze DevMentor. Kolejne moduły (mentorzy, sesje, moderacja)
          pojawią się tutaj.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Baza danych:</span>
        <Suspense fallback={<DatabaseStatusBadge />}>
          <DatabaseStatus />
        </Suspense>
      </CardContent>
      <CardFooter>
        {/* Navigation stays a real link (role "link"); Base UI's Button would
            expose an <a> rendered through it as role "button". */}
        <Link href="/" className={buttonVariants()}>
          Przejdź do strony głównej
        </Link>
      </CardFooter>
    </Card>
  );
}
