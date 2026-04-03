import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from "@/components/ui/card";

type CalloutProps = {
  label: string;
  text: string;
};

export function Callout({ label, text }: CalloutProps) {
  return (
    <Card className="bg-muted/40">
      <CardHeader className="pb-2">
        <Badge variant="secondary">{label}</Badge>
      </CardHeader>
      <CardContent className="pt-0 text-sm text-foreground">
        <p className="leading-relaxed">{text}</p>
      </CardContent>
      <CardFooter className="pt-0 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Callout
      </CardFooter>
    </Card>
  );
}
