"use client"

import { MapKitProvider, SearchProvider } from "@1amageek/mapkit"
import "./globals.css";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="w-full min-h-screen">
        <MapKitProvider options={{ language: "ja" }} fetchToken={async () => {
          const response = await fetch("/api/apple/token", {
            method: "GET",
            cache: "force-cache"
          })
          if (!response.ok) {
            throw new Error("Failed to fetch token")
          }
          return await response.json()
        }}>
          <SearchProvider options={{ language: "ja" }}>
            <>{children}</>
          </SearchProvider>
        </MapKitProvider>
      </body>
    </html>
  );
}
