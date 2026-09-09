"use client";

import { useEffect } from "react";

/**
 * Registers the generated service worker (out/sw.js) in production builds, and
 * actively tears down any stale registration in development.
 *
 * layout.tsx is a server component, so registration has to happen from a client
 * component - same shape as StoreHydrator: renders nothing, works in useEffect.
 */

// Must match next.config.ts basePath. "" today.
const BASE = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");
const CACHE_PREFIX = "pandr5-precache-";
const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // --- development -------------------------------------------------------
    // next dev never serves sw.js, but a worker registered earlier by a local
    // production preview (`npx serve out`) stays active on the same origin and
    // would serve stale production HTML and chunks over the dev server. Tear it
    // down and drop its caches instead of just declining to register.
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => {});
      if (typeof caches !== "undefined") {
        void caches
          .keys()
          .then((names) =>
            Promise.all(
              names.filter((n) => n.startsWith(CACHE_PREFIX)).map((n) => caches.delete(n)),
            ),
          )
          .catch(() => {});
      }
      return;
    }

    // --- production --------------------------------------------------------
    let registration: ServiceWorkerRegistration | undefined;
    let lastCheck = 0;

    const register = () => {
      void navigator.serviceWorker
        .register(`${BASE}/sw.js`, {
          // A worker at /sw.js may claim "/"; at /<basePath>/sw.js it may claim
          // "/<basePath>/". Stated explicitly so a future basePath change is a
          // one-line edit and never needs a Service-Worker-Allowed header.
          scope: `${BASE}/`,
          // Bypass the HTTP cache for sw.js on every registration and update
          // check. GitHub Pages serves Cache-Control: max-age=600; without this
          // the update check can read a cached worker and the user stays on an
          // old build. This is the single guard against the staleness trap.
          updateViaCache: "none",
        })
        .then((reg) => {
          registration = reg;
          lastCheck = Date.now();
        })
        .catch(() => {
          // First load with no network, or an unsupported browser. The app works
          // normally, just without offline support until the next online visit.
        });
    };

    // An installed PWA can be resumed from the background for weeks without a
    // real navigation, and a browser only checks for a new worker on navigation.
    // Poll on resume, throttled, so the app cannot get stranded on an old build.
    const checkForUpdate = () => {
      if (document.visibilityState !== "visible") return;
      if (!registration) return;
      if (Date.now() - lastCheck < UPDATE_INTERVAL_MS) return;
      lastCheck = Date.now();
      void registration.update().catch(() => {});
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    document.addEventListener("visibilitychange", checkForUpdate);

    return () => {
      window.removeEventListener("load", register);
      document.removeEventListener("visibilitychange", checkForUpdate);
    };
  }, []);

  return null;
}
