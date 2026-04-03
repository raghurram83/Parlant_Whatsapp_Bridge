import { IconBadge } from "@/components/IconBadge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type { Slide } from "@/data/slides";

export function SlideFront({ slide }: { slide: Slide }) {
  return (
    <Card className="flex h-full flex-col transition-shadow duration-300 hover:shadow-md">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{slide.timeLabel}</Badge>
          <IconBadge icon={slide.themeIcon} />
        </div>
        <CardTitle className="text-2xl tracking-tight">{slide.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-center rounded-lg border bg-muted/30 p-4">
          {slide.svgArt}
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {slide.frontBullets.map((bullet) => (
            <li key={bullet} className="flex gap-2">
              <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="mt-auto justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span>Tap to flip</span>
        <Badge variant="outline">Front</Badge>
      </CardFooter>
    </Card>
  );
}
