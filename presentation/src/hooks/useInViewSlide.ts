import { useEffect, useRef, useState } from "react";

export function useInViewSlide(ids: string[]) {
  const [activeId, setActiveId] = useState(ids[0]);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { threshold: 0.35 }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [ids]);

  const flashHighlight = (id: string) => {
    setHighlightId(id);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setHighlightId(null), 1200);
  };

  return { activeId, highlightId, flashHighlight };
}
