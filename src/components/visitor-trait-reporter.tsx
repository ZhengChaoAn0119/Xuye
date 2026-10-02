"use client";

import { useEffect } from "react";

const SENT_KEY = "xuye-visitor-trait-sent";

/** Sends a coarse browser profile once per tab. The server stores only its HMAC. */
export function VisitorTraitReporter() {
  useEffect(() => {
    if (sessionStorage.getItem(SENT_KEY)) return;
    sessionStorage.setItem(SENT_KEY, "1");
    const trait = {
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenWidth: screen.width,
      screenHeight: screen.height,
      colorDepth: screen.colorDepth,
      touchPoints: navigator.maxTouchPoints,
    };
    void fetch("/api/v1/visitor/trait", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(trait),
      keepalive: true,
    });
  }, []);
  return null;
}
