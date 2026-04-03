import { Megaphone, MessageSquare, RefreshCcw } from "lucide-react";

export function ExecCommsArt() {
  return (
    <div className="relative flex h-24 w-full items-center justify-center gap-6 text-muted-foreground">
      <Megaphone className="h-12 w-12 text-primary" />
      <MessageSquare className="h-10 w-10" />
      <RefreshCcw className="h-9 w-9" />
    </div>
  );
}
