// app/layout.tsx
import type React from "react";
import type { Metadata } from "next";
import { IBM_Plex_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-ibm-plex-mono",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-playfair-display",
});

export const metadata: Metadata = {
  title: "KetonAI",
  description:
    "Experience the future of AI with KetonAI - your premium artificial intelligence assistant.",
  generator: "v0.dev",
  // You can also declare icons here if you prefer:
  // icons: {
  //   icon: "/favicon.png",
  // },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* ← This <link> tag tells the browser to use /favicon.png (from /public) as the favicon */}
        <link rel="icon" href="/favicon.png" />
      </head>

      <body
        className={`${ibmPlexMono.variable} ${playfairDisplay.variable} font-mono antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
