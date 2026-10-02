"use client";

import { useEffect, useRef } from "react";

/** Closes a <details> popover on an outside pointer action or Escape (focus returns to its summary). */
export function useDismissibleDetails() {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) {
        details.removeAttribute("open");
      }
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !detailsRef.current?.open) return;
      detailsRef.current.removeAttribute("open");
      detailsRef.current.querySelector("summary")?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  return detailsRef;
}
