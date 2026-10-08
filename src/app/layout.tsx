import type { Metadata, Viewport } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { site } from "@/data/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: "%s — Zhecheng Cao" },
  description: site.description,
  openGraph: {
    title: site.title,
    description: site.description,
    type: "website",
    locale: "en_US",
    siteName: "Zhecheng Cao",
  },
  twitter: {
    card: "summary",
    title: site.title,
    description: site.description,
  },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = {
  themeColor: "#f2f2ef",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <MotionProvider>
          <a className="skip-link" href="#main">
            Skip to content / 跳到正文
          </a>
          <div id="top" />
          <Header />
          {children}
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}
