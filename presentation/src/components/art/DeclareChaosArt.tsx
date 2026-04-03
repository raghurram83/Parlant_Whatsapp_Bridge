import { Timer, ListChecks } from "lucide-react";

export function DeclareChaosArt() {
  return (
    <div className="relative flex h-24 w-full items-center justify-center gap-6 text-muted-foreground">
      <Timer className="h-12 w-12 text-primary" />
      <ListChecks className="h-11 w-11" />
    </div>
  );
}
