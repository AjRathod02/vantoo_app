import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { SubNav } from "@/components/layout/SubNav";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { Toaster } from "@/components/ui/Toaster";
import { InstallPrompt } from "@/components/InstallPrompt";
import { FirebaseAnalytics } from "@/components/FirebaseAnalytics";
import { AuthProvider } from "@/components/AuthProvider";

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
          <Navbar />
          <SubNav />
          <main className="flex-1 pb-20 sm:pb-0">{children}</main>
          <Footer />
          <MobileNav />
          <Toaster />
          <InstallPrompt />
          <FirebaseAnalytics />
        </AuthProvider>
      </body>
    </html>
  );
}
