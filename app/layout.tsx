import type { Metadata } from "next";
import { Manrope, Space_Mono } from "next/font/google";
import "./globals.css";

import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Evergreen Run",
  description:
    "Durability-first running for recreational runners 35+. Every week, know how to keep running without overdoing it.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let signedIn = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  } catch {
    // Misconfiguration or auth hiccup — render without the app header rather
    // than failing the whole page.
    signedIn = false;
  }

  return (
    <html
      lang="en"
      className={`${manrope.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {signedIn && <AppHeader />}
        {children}
      </body>
    </html>
  );
}
