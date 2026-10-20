import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { EmergencyBanner } from "@/components/EmergencyBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { SITE_DESCRIPTION, SITE_NAME, SITE_SHORT_NAME, THEME_COLOUR } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s · ${SITE_SHORT_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_SHORT_NAME,
  appleWebApp: { capable: true, title: SITE_SHORT_NAME, statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOUR,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body className="flex min-h-dvh flex-col antialiased">
        <EmergencyBanner />
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
