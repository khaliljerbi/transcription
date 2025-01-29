import NavHeader from "@/components/custom/nav-header";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Audio transcription",
  description: "The only audio transcription you need",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* <head>
        <script src="//unpkg.com/react-scan/dist/auto.global.js" />
      </head> */}
      <body className={cn("min-h-screen", inter.className)}>
        <NavHeader />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
