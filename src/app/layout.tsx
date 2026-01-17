import type { Metadata } from "next";
import "./globals.css";
import CookieBanner from "@/components/shared/CookieBanner";
import { ThemeProvider } from "@/lib/context/ThemeContext";

export const metadata: Metadata = {
  title: "ToDo App - Multi-Mandanten Aufgabenverwaltung",
  description: "Professionelle Multi-Mandanten ToDo-Verwaltung mit Kollaboration",
  manifest: "/manifest.json",
  themeColor: "#14B8A6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ToDo App",
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
