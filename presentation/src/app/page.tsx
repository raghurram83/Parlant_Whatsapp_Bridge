"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Deck } from "@/components/Deck";
import { slides } from "@/data/slides";
import { useInViewSlide } from "@/hooks/useInViewSlide";

export default function HomePage() {
  const ids = useMemo(() => slides.map((slide) => slide.id), []);
  const { activeId, highlightId, flashHighlight } = useInViewSlide(ids);
  const [presenterMode, setPresenterMode] = useState(false);
  const [flipped, setFlipped] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ids.map((id) => [id, false]))
  );

  const activeIndex = Math.max(
    0,
    slides.findIndex((slide) => slide.id === activeId)
  );

  const allFlipped = slides.every((slide) => flipped[slide.id]);

  const toggleCard = (id: string) => {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    const next = !allFlipped;
    setFlipped(Object.fromEntries(ids.map((id) => [id, next])));
  };

  const togglePresenter = () => {
    setPresenterMode((prev) => !prev);
  };

  useEffect(() => {
    if (presenterMode) {
      setFlipped(Object.fromEntries(ids.map((id) => [id, false])));
    }
  }, [presenterMode, ids]);

  return (
    <div>
      <AppShell
        slides={slides}
        activeIndex={activeIndex}
        activeId={activeId}
        onFlipAll={toggleAll}
        allFlipped={allFlipped}
        presenterMode={presenterMode}
        onTogglePresenter={togglePresenter}
        onNavClick={flashHighlight}
      />
      <Deck
        slides={slides}
        flipped={flipped}
        onToggle={(id) => {
          flashHighlight(id);
          toggleCard(id);
        }}
        presenterMode={presenterMode}
        highlightId={highlightId}
      />
    </div>
  );
}
