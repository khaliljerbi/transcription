import NavHeader from "@/components/custom/nav-header";
import { cn } from "@/lib/utils";
import Providers from "@/providers";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import ChatWidgetWrapper from "./chat-widget-wrapper";
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
      <body className={cn("relative min-h-screen", inter.className)}>
        <Providers>
          <NavHeader />
          <Suspense fallback={<p>Loading...</p>}>
            {children}
            <ChatWidgetWrapper />
          </Suspense>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
