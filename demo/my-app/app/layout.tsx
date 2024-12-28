"use client"

import { MapKitProvider } from "@1amageek/mapkit"
import "./globals.css";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="w-full min-h-screen">
        <MapKitProvider fetchToken={async () => {
          const response = await fetch("/api/apple/token", {
            method: "GET",
            cache: "force-cache"
          })
          if (!response.ok) {
            throw new Error("Failed to fetch token")
          }
          return await response.json()
        }}>
          <>{children}</>
        </MapKitProvider>
      </body>
    </html>
  );
}
