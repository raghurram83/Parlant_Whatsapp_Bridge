import { AlertTriangle, Signal, Radio } from "lucide-react";

export function ExecutiveFramingArt() {
  return (
    <div className="relative flex h-24 w-full items-center justify-center gap-6 text-muted-foreground">
      <div className="relative">
        <AlertTriangle className="h-12 w-12 text-primary" />
        <Signal className="absolute -right-4 -top-2 h-6 w-6 text-primary/70" />
      </div>
      <Radio className="h-10 w-10" />
    </div>
  );
}
