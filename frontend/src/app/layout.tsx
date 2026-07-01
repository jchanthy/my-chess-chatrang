import type { Metadata } from "next";
import { Kantumruy_Pro } from "next/font/google";
import "./globals.css";

const kantumruyPro = Kantumruy_Pro({
  variable: "--font-kantumruy-pro",
  subsets: ["khmer", "latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Ouk Chatrang (អុកចត្រង្គ) - Khmer Chess",
  description: "Play and learn traditional Cambodian Chess (Ouk Chatrang) with AI Coaching and Fairy-Stockfish engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="km" className={`${kantumruyPro.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
