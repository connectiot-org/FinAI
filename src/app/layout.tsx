import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Fintra — Multiple AI Models. One Finance Workspace.",
  description:
    "Fintra is the AI workspace for finance teams: chat with GPT, Claude, Gemini and DeepSeek in one place, run financial analysis, build reports and decks, check numbers for errors, and reuse templates and workflows.",
  keywords: [
    "Fintra",
    "AI finance workspace",
    "financial analysis AI",
    "multi-model AI",
    "FP&A AI",
    "report builder",
    "finance AI agents",
    "auditable AI",
  ],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Fintra — Multiple AI Models. One Finance Workspace.",
    description:
      "Chat with every frontier AI model, run financial analysis, build reports and decks, and automate recurring finance work — in one professional workspace.",
    siteName: "Fintra",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fintra — Multiple AI Models. One Finance Workspace.",
    description:
      "The AI workspace for finance teams. Every model. Every workflow. One place.",
  },
};

export const viewport: Viewport = {
  themeColor: "#fafaf9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
