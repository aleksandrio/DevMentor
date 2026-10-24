import Link from "next/link";
import { Badge } from "@devmentor/ui/components/badge";
import { Button } from "@devmentor/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@devmentor/ui/components/card";

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
        <Badge variant="outline">jeszcze niepodłączona</Badge>
      </CardContent>
      <CardFooter>
        <Button nativeButton={false} render={<Link href="/" />}>
          Przejdź do strony głównej
        </Button>
      </CardFooter>
    </Card>
  );
}
