import { GitBranch, GitMerge } from "lucide-react";

export function ConflictLeadershipArt() {
  return (
    <div className="relative flex h-24 w-full items-center justify-center gap-6 text-muted-foreground">
      <GitBranch className="h-11 w-11" />
      <GitMerge className="h-12 w-12 text-primary" />
    </div>
  );
}
