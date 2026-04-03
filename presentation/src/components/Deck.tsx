"use client";

import { cn } from "@/lib/utils";
import { FlipSlideCard } from "@/components/FlipSlideCard";
import type { Slide } from "@/data/slides";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type DeckProps = {
  slides: Slide[];
  flipped: Record<string, boolean>;
  onToggle: (id: string) => void;
  presenterMode: boolean;
  highlightId: string | null;
};

export function Deck({
  slides,
  flipped,
  onToggle,
  presenterMode,
  highlightId
}: DeckProps) {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 pb-20" id="content">
      <div className={cn("flex flex-col gap-8", presenterMode && "gap-10")}>
        {slides.map((slide) => (
          <FlipSlideCard
            key={slide.id}
            slide={slide}
            isFlipped={flipped[slide.id]}
            onToggle={() => onToggle(slide.id)}
            isHighlighted={highlightId === slide.id}
            presenterMode={presenterMode}
          />
        ))}
      </div>
      {presenterMode ? (
        <Card className="mt-10 bg-muted/40">
          <CardHeader className="pb-2">
            <Badge variant="secondary">Presenter mode</Badge>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            Presenter mode is active. Slides open with minimal detail. Flip a card to reveal the back.
          </CardContent>
          <CardFooter className="pt-0 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Flip to reveal
          </CardFooter>
        </Card>
      ) : null}
    </section>
  );
}
