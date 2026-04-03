import { Gauge, ArrowDownUp } from "lucide-react";

export function MitigationTradeoffsArt() {
  return (
    <div className="relative flex h-24 w-full items-center justify-center gap-6 text-muted-foreground">
      <Gauge className="h-12 w-12 text-primary" />
      <ArrowDownUp className="h-10 w-10" />
    </div>
  );
}
