import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#FAFAF8",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://flowfoundry.io";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "FlowFoundry — Autonomous AI Lead-to-Customer Engine",
    template: "%s | FlowFoundry",
  },
  description:
    "Enterprise B2B automation platform that ingests inbound business leads, analyzes intent with AI, deterministically qualifies pipeline, and synchronizes with high-velocity CRMs.",
  keywords: [
    "B2B automation",
    "AI lead qualification",
    "RevOps engine",
    "CRM routing",
    "lead-to-customer",
    "autonomous pipeline",
    "enterprise RevOps",
  ],
  authors: [{ name: "FlowFoundry Architecture Team", url: baseUrl }],
  creator: "FlowFoundry",
  publisher: "FlowFoundry",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "FlowFoundry",
    title: "FlowFoundry — Autonomous AI Lead-to-Customer Engine",
    description:
      "Enterprise B2B automation platform that ingests inbound business leads, analyzes intent with AI, deterministically qualifies pipeline, and synchronizes with high-velocity CRMs.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowFoundry — Autonomous AI Lead-to-Customer Engine",
    description:
      "Enterprise B2B automation platform that ingests inbound business leads, analyzes intent with AI, and synchronizes with high-velocity CRMs.",
    creator: "@FlowFoundryAI",
  },
  alternates: {
    canonical: baseUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${newsreader.variable} ${jetbrainsMono.variable} light`}>
      <body className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] font-sans antialiased flex flex-col selection:bg-[#1E3A2F] selection:text-white">
        {/* Skip to Main Content Link for Keyboard and Screen-Reader Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#1A1A1A] focus:text-[#FAFAF8] focus:border focus:border-[#1A1A1A] focus:rounded-sm focus:shadow-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A2F] font-mono text-xs"
        >
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
