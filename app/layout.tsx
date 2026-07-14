import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { SearchProvider } from "@/components/search-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { VersePopup } from "@/components/verse-popup";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CID — OSINT & Security Toolkit",
  description:
    "Professional cybersecurity tools for investigators, DFIR analysts, penetration testers, privacy professionals, and security researchers.",
  keywords: [
    "cybersecurity",
    "investigation",
    "DFIR",
    "OSINT",
    "threat intelligence",
    "toolkit",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-background text-foreground antialiased`}>
        <ThemeProvider>
          <SearchProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Analytics />
            <VersePopup />
          </SearchProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
