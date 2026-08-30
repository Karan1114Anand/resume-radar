import type { Metadata } from "next";
import { Special_Elite, Bitter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

const typewriter = Special_Elite({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-typewriter",
  display: "swap",
});

const slab = Bitter({
  subsets: ["latin"],
  variable: "--font-slab",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ResumeRadar — Upload your resume. Radar finds the rest.",
  description:
    "Upload a PDF resume, pick a location, and get matched jobs, a hiring contact, and a ready-to-send outreach email.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${typewriter.variable} ${slab.variable}`}>
      <body className="min-h-screen bg-cream font-serif text-ink antialiased [background-image:linear-gradient(rgba(43,38,34,0.05)_1px,transparent_1px),radial-gradient(circle_at_15%_0%,rgba(107,74,47,0.08),transparent_45%),radial-gradient(circle_at_85%_100%,rgba(28,63,95,0.07),transparent_45%)] [background-size:100%_28px,100%_100%,100%_100%]">
        <Nav />
        <div className="min-h-[calc(100vh-4rem)]">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
