import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@devmentor/ui/components/button";
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
        <Button nativeButton={false} render={<Link href="/" />}>
          Przejdź do strony głównej
        </Button>
      </CardFooter>
    </Card>
  );
}
