"use client";

import { useEffect } from "react";

// Registered in production only — in dev, a service worker caching requests
// while Turbopack/webpack rebuilds and hot-reloads causes stale-code
// confusion that isn't worth debugging around.
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  }, []);

  return null;
}
