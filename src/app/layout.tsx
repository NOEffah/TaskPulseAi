import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/query-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({subsets : ["latin"]});

export const metadata: Metadata = {
  title: "TaskPulse AI",
  description: "Smart Task Management with AI",
  icons: {
    icon: "/taskpulseai.ico",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(inter.className, "antialised min-h-screen")}
      >
      <QueryProvider>
        <Toaster/>
        {children}
      </QueryProvider>
        
      </body>
    </html>
  );
}
