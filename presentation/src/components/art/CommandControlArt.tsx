import { Network, Server, Users } from "lucide-react";

export function CommandControlArt() {
  return (
    <div className="relative flex h-24 w-full items-center justify-center gap-6 text-muted-foreground">
      <Users className="h-10 w-10" />
      <Network className="h-12 w-12 text-primary" />
      <Server className="h-10 w-10" />
    </div>
  );
}
