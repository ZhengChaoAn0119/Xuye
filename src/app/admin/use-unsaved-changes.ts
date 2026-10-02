"use client";

import { useCallback, useEffect, useRef } from "react";

const warning = "尚有未儲存的變更，確定要離開嗎？";

export function useUnsavedChanges() {
  const dirty = useRef(false);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const followLink = (event: MouseEvent) => {
      if (!dirty.current || event.defaultPrevented || event.button !== 0) return;
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (target && !window.confirm(warning)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", followLink, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", followLink, true);
    };
  }, []);
  return {
    markDirty: useCallback(() => {
      dirty.current = true;
    }, []),
    markClean: useCallback(() => {
      dirty.current = false;
    }, []),
  };
}
