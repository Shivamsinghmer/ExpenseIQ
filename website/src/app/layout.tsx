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
  metadataBase: new URL("https://expensepal.sandicodes.me"),
  title: {
    default: "ExpensePal – AI-Powered Budgeting & Expense Tracker",
    template: "%s | ExpensePal"
  },
  description: "Take control of your finances with ExpensePal. Smart AI tracking, SMS bank sync, receipt scanning, and expert financial insights. Build wealth with ease.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  keywords: [
    "best expense tracker app", 
    "AI budgeting app", 
    "track EMI and expenses easily", 
    "personal finance manager", 
    "smart budgeting software",
    "automatic expense tracking",
    "SMS banking sync",
    "receipt scanner app"
  ],
  authors: [{ name: "Sandeepan Nandi" }],
  publisher: "ExpensePal",
  openGraph: {
    title: "ExpensePal – AI-Powered Budgeting & Expense Tracker App",
    description: "Smart tracking, AI insights, and multi-currency support. Take control of your money today.",
    type: "website",
    locale: "en_US",
    url: "https://expensepal.sandicodes.me",
    siteName: "ExpensePal",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "ExpensePal Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ExpensePal – AI-Powered Budgeting & Expense Tracker App",
    description: "Track expenses, manage budgets, and get AI insights with ExpensePal.",
    creator: "@sandeepan",
    images: ["/logo.png"],
  },
  alternates: {
    canonical: "/",
  },
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ExpensePal",
    "operatingSystem": "iOS, Android, Web",
    "applicationCategory": "FinanceApplication",
    "description": "Smart AI-powered expense tracking and budgeting application.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1000"
    }
  };

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="font-sans bg-white text-slate-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
