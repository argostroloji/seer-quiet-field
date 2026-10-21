import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Instrument_Sans, Geist_Mono } from "next/font/google";
import { EcosystemBar } from "@/components/ecosystem-bar";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

// [dep 1] OFL stand-ins for PP Neue Montreal / Suisse Intl Mono (commercial, not licensed to us).
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans-face", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono-face", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://seer-quiet-field.vercel.app"),
  title: { default: "Seer — Decision infrastructure", template: "%s · Seer" },
  description:
    "Six connected Seer interfaces on the Electric Foundation kit, running on live Seer market data.",
  openGraph: { images: ["/preview.png"] },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#101013" },
    { media: "(prefers-color-scheme: light)", color: "#F7F7F9" },
  ],
};

const themeScript = `try{var t=localStorage.getItem("seer-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <Script id="theme" strategy="beforeInteractive">{themeScript}</Script>
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-white">
          Skip to content
        </a>
        <EcosystemBar />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
