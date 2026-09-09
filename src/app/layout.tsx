import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { StoreHydrator } from "@/components/StoreHydrator";

export const metadata: Metadata = {
  title: {
    default: "PANDR-5",
    template: "%s · PANDR-5",
  },
  description:
    "Tracker for the PANDR-5 model: PPLUL, abating RIR, non-competing pairs, double progression, five days.",
  applicationName: "PANDR-5",
};

export const viewport: Viewport = {
  themeColor: "#0e0d0b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const FONTS =
  "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@500;700;800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;600&display=swap";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body className="antialiased">
        <StoreHydrator />
        <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 pb-28 sm:px-6 sm:pb-12">
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
