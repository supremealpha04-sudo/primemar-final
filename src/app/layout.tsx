import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PrimeMar - Earn From Your Content",
  description: "The creator-first social platform where serious content creators earn from their content. Premium features, fair monetization, and transparent earnings.",
  keywords: ["social media", "creator economy", "monetization", "content creator", "PrimeMar"],
  openGraph: {
    title: "PrimeMar - Earn From Your Content",
    description: "Join the creator-first social platform with fair monetization.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-cream text-navy-950 antialiased">
        <Providers>
          {children}
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            toastOptions={{
              style: {
                fontFamily: "var(--font-inter)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
