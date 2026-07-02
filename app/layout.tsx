import type { Metadata } from "next";
import { Manrope, Space_Mono } from "next/font/google";
import "./globals.css";

import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";

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
  let account: { name: string; email: string } | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("runner_profile")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      account = { name: profile?.display_name ?? "", email: user.email ?? "" };
    }
  } catch {
    // Misconfiguration or auth hiccup — render without app chrome rather than
    // failing the whole page.
    account = null;
  }

  return (
    <html
      lang="en"
      className={`${manrope.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {account ? (
          <div className="flex min-h-full flex-1">
            <AppSidebar user={account} />
            <div className="flex min-w-0 flex-1 flex-col">
              <AppHeader />
              {children}
            </div>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
