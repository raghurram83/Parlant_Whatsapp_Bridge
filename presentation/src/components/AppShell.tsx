"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { Slide } from "@/data/slides";

type AppShellProps = {
  slides: Slide[];
  activeIndex: number;
  activeId: string;
  onFlipAll: () => void;
  allFlipped: boolean;
  presenterMode: boolean;
  onTogglePresenter: () => void;
  onNavClick: (id: string) => void;
};

export function AppShell({
  slides,
  activeIndex,
  activeId,
  onFlipAll,
  allFlipped,
  presenterMode,
  onTogglePresenter,
  onNavClick
}: AppShellProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Major Incident Manager
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Flip Deck Command Framework
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant={allFlipped ? "default" : "outline"}
              onClick={onFlipAll}
              aria-pressed={allFlipped}
              className="uppercase tracking-[0.2em]"
            >
              {allFlipped ? "Unflip all" : "Flip all"}
            </Button>
            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2">
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Presenter
              </span>
              <Switch
                checked={presenterMode}
                onCheckedChange={() => onTogglePresenter()}
                aria-label="Toggle presenter mode"
              />
            </div>
            <Badge variant="secondary" className="uppercase tracking-[0.2em]">
              Slide {activeIndex + 1} / {slides.length}
            </Badge>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2 text-xs">
          {slides.map((slide, index) => (
            <Button
              key={slide.id}
              asChild
              variant={activeId === slide.id ? "default" : "outline"}
              size="sm"
              onClick={() => onNavClick(slide.id)}
              className={cn(
                "uppercase tracking-[0.18em]",
                activeId !== slide.id && "text-muted-foreground"
              )}
            >
              <a
                href={`#${slide.id}`}
                aria-label={`Go to slide ${index + 1}: ${slide.title}`}
              >
                {index + 1}
              </a>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
