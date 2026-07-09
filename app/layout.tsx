import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { Toaster } from "@/components/ui/Toaster";
import { FirebaseAnalytics } from "@/components/FirebaseAnalytics";
import { AuthProvider } from "@/components/AuthProvider";
import { LocationProvider } from "@/components/location/LocationProvider";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vantoo — Food, Grocery, Medicine & Shopping Delivered",
  description:
    "Vantoo is your everyday super-app for food delivery, groceries, medicine and online shopping, delivered fast.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vantoo",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B00",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <AuthProvider>
          <LocationProvider>
            <CustomerShell>{children}</CustomerShell>
          </LocationProvider>
          <Toaster />
          <FirebaseAnalytics />
        </AuthProvider>
      </body>
    </html>
  );
}
