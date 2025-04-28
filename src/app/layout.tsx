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
        <main className="flex flex-col md:flex-row h-screen">
          <div className="flex-1/4 min-h-[40vh] md:h-screen overflow-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
