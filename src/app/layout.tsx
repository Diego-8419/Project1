import type { Metadata } from "next";
import "./globals.css";
import CookieBanner from "@/components/shared/CookieBanner";
import { ThemeProvider } from "@/lib/context/ThemeContext";

export const metadata: Metadata = {
  title: "JustToDo - Aufgabenverwaltung",
  description: "Professionelle Multi-Mandanten ToDo-Verwaltung mit Kollaboration",
  manifest: "/manifest.json",
  themeColor: "#14b8a6",
  icons: {
    icon: [
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icons/icon-96x96.png",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JustToDo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head>
        <link rel="icon" type="image/png" sizes="96x96" href="/icons/icon-96x96.png" />
        <link rel="icon" type="image/png" sizes="72x72" href="/icons/icon-72x72.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          {children}
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
