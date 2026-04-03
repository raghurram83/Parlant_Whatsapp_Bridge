import { slides } from "@/data/slides";
import { Callout } from "@/components/Callout";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PrintPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-8 py-12">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Print View
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Major Incident Flip Deck</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            All slides expanded for PDF export.
          </p>
        </div>
        <div className="space-y-10">
          {slides.map((slide) => (
            <Card key={slide.id}>
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{slide.timeLabel}</Badge>
                  <Badge variant="outline">{slide.title}</Badge>
                </div>
                <CardTitle className="text-2xl tracking-tight">{slide.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {slide.frontBullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-4 text-sm text-muted-foreground">
                  {slide.back.sections.map((section, index) => (
                    <div key={section.heading} className="space-y-2">
                      {index > 0 ? <Separator /> : null}
                      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
                        {section.heading}
                      </h3>
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
                  ))}
                </div>
                {slide.back.callouts ? (
                  <div className="space-y-3">
                    {slide.back.callouts.map((callout) => (
                      <Callout key={callout.label} label={callout.label} text={callout.text} />
                    ))}
                  </div>
                ) : null}
              </CardContent>
              <CardFooter className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Expanded view
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
