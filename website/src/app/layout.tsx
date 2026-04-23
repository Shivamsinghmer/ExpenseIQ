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
  title: "ExpensePal – Smart Budgeting & Expense Tracker App",
  description: "Track expenses, manage budgets, get AI insights, and stay financially secure with ExpensePal.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  keywords: ["best expense tracker app", "AI budgeting app", "track EMI and expenses easily", "personal finance", "smart budgeting"],
  openGraph: {
    title: "ExpensePal – Smart Budgeting & Expense Tracker App",
    description: "Take control of your finances with ExpensePal. Smart tracking, AI insights, and multi-currency support.",
    type: "website",
    locale: "en_US",
    url: "https://expensepal.com",
    siteName: "ExpensePal",
  },
  twitter: {
    card: "summary_large_image",
    title: "ExpensePal – Smart Budgeting & Expense Tracker App",
    description: "Track expenses, manage budgets, get AI insights, and stay financially secure with ExpensePal.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="font-sans bg-white text-slate-900">{children}</body>
    </html>
  );
}
