import type { Metadata, Viewport } from "next";

// Self-hosted fonts. Each import is a CSS side effect that Turbopack bundles into the
// app stylesheet and rewrites to /_next/static/media/<name>.<hash>.woff2 — same-origin,
// so the service worker precaches them and the app renders correctly offline.
//
// Import ONLY these per-subset/per-weight files. The package root or a subset root
// ("/latin.css") pulls every weight and every subset.
//
// GOTCHA: @fontsource/big-shoulders-display@5.3.0 ships an older exports map
// ({ "./*": "./*.css" } with no "./*.css" entry), so its subpaths must be imported
// WITHOUT the .css extension. The other two packages accept either form.
import "@fontsource/big-shoulders-display/latin-700";
import "@fontsource/big-shoulders-display/latin-800";
import "@fontsource/instrument-sans/latin-400.css";
import "@fontsource/instrument-sans/latin-400-italic.css";
import "@fontsource/instrument-sans/latin-500.css";
import "@fontsource/instrument-sans/latin-600.css";
import "@fontsource/instrument-sans/latin-700.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-600.css";

import "./globals.css";
import { Nav } from "@/components/Nav";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { StoreHydrator } from "@/components/StoreHydrator";

// Next applies basePath to routes, but NOT to hand-written metadata hrefs. These three
// must carry the prefix themselves or they 404 on a subpath deploy, which silently
// downgrades the install to a bookmark with a screenshot icon.
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

export const metadata: Metadata = {
  title: {
    default: "PANDR-5",
    template: "%s · PANDR-5",
  },
  description:
    "Tracker for the PANDR-5 model: PPLUL, abating RIR, non-competing pairs, double progression, five days.",
  applicationName: "PANDR-5",
  manifest: `${BASE_PATH}/manifest.webmanifest`,
  icons: {
    icon: [{ url: `${BASE_PATH}/favicon.ico`, sizes: "any" }],
    apple: [{ url: `${BASE_PATH}/apple-touch-icon.png`, sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "PANDR-5",
    statusBarStyle: "black-translucent",
  },
  // The app is full of bare numbers (rep counts, loads, "8-12"). Without this, iOS
  // turns some of them into tappable phone links.
  formatDetection: { telephone: false },
  // Next 15.5.25 emits only the unprefixed `mobile-web-app-capable` for
  // appleWebApp.capable. iOS still documents the apple-prefixed name, so add it here.
  // Do NOT also hand-write a raw <meta> tag: React does not dedupe them.
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#0e0d0b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <StoreHydrator />
        <ServiceWorkerRegistrar />
        <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-5xl flex-col pt-[env(safe-area-inset-top)] pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(7rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] sm:pb-12 sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]">
          <Nav />
          <main className="flex-1">{children}</main>
          <footer className="mt-16 border-t border-line pt-6 text-xs text-bone-3">
            <p>
              PANDR-5 v1.1.1. An experimental model. Not medical advice. Data stays in this
              browser.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
