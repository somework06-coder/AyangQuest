import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AyangQuest - Game Web Bucin Spesial Buat Ayang 💘",
  description: "Bikin game petualangan lucu buat pasanganmu! Gratis, gampang, dan bikin baper. Tantang ayangmu jawab pertanyaan maut sekarang!",
  keywords: ["ayang quest", "game bucin", "game pasangan", "web game gratis", "kuis pacar", "althur somework", "game cinta"],
  authors: [{ name: "Althur Somework", url: "https://www.threads.net/@althur_somework" }],
  openGraph: {
    title: "AyangQuest - Game Web Bucin Spesial Buat Ayang 💘",
    description: "Bikin game petualangan lucu buat pasanganmu! Gratis, gampang, dan bikin baper.",
    url: "https://ayangquest.vercel.app", // Fallback URL
    siteName: "AyangQuest",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AyangQuest - Game Web Bucin Spesial Buat Ayang 💘",
    description: "Bikin game petualangan lucu buat pasanganmu! Gratis, gampang, dan bikin baper.",
    creator: "@althur_somework",
  },
};

import AnalyticsTracker from "@/components/AnalyticsTracker";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
