import { Callout } from "@/components/Callout";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type { Slide } from "@/data/slides";

export function SlideBack({ slide }: { slide: Slide }) {
  return (
    <Card className="flex h-full flex-col transition-shadow duration-300 hover:shadow-md">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{slide.timeLabel}</Badge>
          <Badge variant="outline">Back</Badge>
        </div>
        <CardTitle className="text-xl tracking-tight">{slide.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4 overflow-y-auto pr-2 text-sm text-muted-foreground">
        {slide.back.sections.map((section, index) => (
          <div key={section.heading} className="space-y-3">
            {index > 0 ? <Separator /> : null}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                {section.heading}
              </h4>
              {section.body ? (
                <p className="leading-relaxed text-foreground">{section.body}</p>
              ) : null}
              {section.bullets ? (
                <ul className="space-y-2">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ))}
        {slide.back.callouts ? (
          <div className="space-y-3">
            {slide.back.callouts.map((callout) => (
              <Callout key={callout.label} label={callout.label} text={callout.text} />
            ))}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Tap to flip
      </CardFooter>
    </Card>
  );
}
