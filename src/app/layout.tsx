import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";



const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["400", "700"], 
});

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
        className={cn(poppins.className, "bg-white text-slate-900 min-h-screen")}
      >
        {children}
      </body>
    </html>
  );
}
