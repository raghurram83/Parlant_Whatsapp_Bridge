import { Scale, Zap } from "lucide-react";

export function TriageHypothesisArt() {
  return (
    <div className="relative flex h-24 w-full items-center justify-center gap-6 text-muted-foreground">
      <Scale className="h-12 w-12" />
      <Zap className="h-10 w-10 text-primary" />
    </div>
  );
}
