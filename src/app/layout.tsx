import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Faculty Performance Appraisal Portal | Northbridge Institute",
  description: "Secure self-review and performance appraisal portal for faculty.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans antialiased h-full`}>
      <body className="min-h-full flex flex-col bg-[#FFFDF7] text-[#111827]">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
