import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Daily Tasks",
  description: "Personal daily task tracker",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/logo-light.png", sizes: "1024x1024", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/icons/logo-dark.png", sizes: "1024x1024", type: "image/png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: [
      { url: "/icons/logo-light.png", sizes: "1024x1024", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Daily Tasks",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F2F2F7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/*
         * On mobile: full-screen, feels native.
         * On desktop: centred 390 px column (iPhone 14 width) on a dark backdrop
         * so it previews exactly as it would on device.
         */}
        <div
          style={{
            minHeight: "100dvh",
            backgroundColor: "#1C1C1E",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "480px",
              minHeight: "100dvh",
              backgroundColor: "#F2F2F7",
              position: "relative",
              overflowX: "hidden",
            }}
          >
            <AppShell>{children}</AppShell>
          </div>
        </div>
      </body>
    </html>
  );
}
