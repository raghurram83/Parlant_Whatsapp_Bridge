import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

type IconBadgeProps = {
  icon: ReactNode;
};

export function IconBadge({ icon }: IconBadgeProps) {
  return (
    <Badge variant="outline" className="h-9 w-9 justify-center p-0 text-primary">
      {icon}
    </Badge>
  );
}
