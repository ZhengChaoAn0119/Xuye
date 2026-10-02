"use client";

import { useEffect, useRef } from "react";

/**
 * Closes a <details> popover on an outside pointer action, on Escape (focus returns to its
 * summary), and after following a link inside it — the header persists across client
 * navigations, so an open menu would otherwise stay open on the next page.
 */
export function useDismissibleDetails() {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const details = detailsRef.current;
    const closeOnLink = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a"))
        details?.removeAttribute("open");
    };
    details?.addEventListener("click", closeOnLink);
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
      details?.removeEventListener("click", closeOnLink);
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  return detailsRef;
}
