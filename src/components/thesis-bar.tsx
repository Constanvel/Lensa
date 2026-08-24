"use client";

import { useEffect, useState } from "react";

/**
 * The thesis follows you down the essay once the header has scrolled past.
 * It occupies no height until it appears, so nothing reflows.
 */
export function ThesisBar({ thesis }: { thesis: string }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 180);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!shown}
      className="sticky top-[60px] z-15 h-[49px] overflow-hidden border-b border-[color:var(--rule)] bg-[color:var(--paper)] transition-[opacity,transform] duration-150"
      style={
        shown
          ? { opacity: 1 }
          : { opacity: 0, transform: "translateY(-6px)", pointerEvents: "none", marginBottom: -49 }
      }
    >
      <div className="mx-auto flex h-12 max-w-[824px] items-center gap-4 px-6">
        <span className="meta flex-none">Thesis</span>
        <p className="serif-sm m-0 overflow-hidden text-ellipsis whitespace-nowrap">{thesis}</p>
      </div>
    </div>
  );
}
