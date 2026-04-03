"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Slide } from "@/data/slides";
import { SlideFront } from "@/components/SlideFront";
import { SlideBack } from "@/components/SlideBack";
import { Button } from "@/components/ui/button";

type FlipSlideCardProps = {
  slide: Slide;
  isFlipped: boolean;
  onToggle: () => void;
  isHighlighted: boolean;
  presenterMode: boolean;
};

export function FlipSlideCard({
  slide,
  isFlipped,
  onToggle,
  isHighlighted,
  presenterMode
}: FlipSlideCardProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <article
        id={slide.id}
        className={cn(
          "scroll-mt-28",
          isHighlighted && "ring-2 ring-primary/30 ring-offset-4 ring-offset-background rounded-xl"
        )}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={onToggle}
          aria-expanded={isFlipped}
          className="h-full w-full justify-start p-0 text-left"
        >
          <div className={cn("w-full", presenterMode && "text-[1.02rem]")}>
            <SlideFront slide={slide} />
          </div>
        </Button>
        <motion.div
          initial={false}
          animate={{
            height: isFlipped ? "auto" : 0,
            opacity: isFlipped ? 1 : 0
          }}
          className="overflow-hidden"
        >
          <div className="mt-6">
            <SlideBack slide={slide} />
          </div>
        </motion.div>
      </article>
    );
  }

  return (
    <article
      id={slide.id}
      className={cn(
        "scroll-mt-28",
        isHighlighted && "ring-2 ring-primary/30 ring-offset-4 ring-offset-background rounded-xl"
      )}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={onToggle}
        aria-expanded={isFlipped}
        className={cn(
          "flip-shell group h-full w-full justify-start p-0 text-left",
          presenterMode && "text-[1.02rem]"
        )}
      >
        <motion.div
          className={cn(
            "flip-inner relative min-h-[460px] transition-transform duration-300 group-hover:-translate-y-1",
            presenterMode && "min-h-[520px]"
          )}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flip-face absolute inset-0 flex h-full w-full flex-col">
            <SlideFront slide={slide} />
          </div>
          <div className="flip-face flip-back absolute inset-0 flex h-full w-full flex-col">
            <div className="h-full overflow-hidden">
              <SlideBack slide={slide} />
            </div>
          </div>
        </motion.div>
      </Button>
    </article>
  );
}
