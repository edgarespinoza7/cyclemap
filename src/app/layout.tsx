// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CycleMap",
  description: "Discover bike networks around the world",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(inter.className, "bg-white text-slate-900 min-h-screen")}
      >
        {/* The main structure is now handled by nested layouts like (main)/layout.tsx */}
        {children}
      </body>
    </html>
  );
}
