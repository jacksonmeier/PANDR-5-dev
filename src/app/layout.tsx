import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PANDR-5",
  description: "Tracker for the PANDR-5 training model",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
