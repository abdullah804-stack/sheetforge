import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://YOUR_VERCEL_URL"),
  title: {
    default: "SheetForge — See your spreadsheet clearly",
    template: "%s — SheetForge",
  },
  description:
    "Upload any Excel or CSV file. Get a clean view with charts, a plain-English summary, and easy editing. Share it with a link, or download it back anytime.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    url: "https://YOUR_VERCEL_URL",
    siteName: "SheetForge",
    title: "SheetForge — See your spreadsheet clearly",
    description:
      "Upload any Excel or CSV file. Get a clean view with charts, a plain-English summary, and easy editing.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SheetForge — See your spreadsheet clearly",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SheetForge — See your spreadsheet clearly",
    description: "Turn spreadsheets into friendly, shareable apps.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}