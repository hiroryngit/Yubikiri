import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { IntlProvider } from "@/components/intl-provider";
import { AuthReturnHandler } from "@/components/auth-return-handler";
import { AuthStateListener } from "@/components/auth-state-listener";
import { Suspense } from "react";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Yubikiri",
  description: "Record personal agreements as evidence with timestamps and metadata.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <IntlProvider>
            <Suspense>
              <AuthReturnHandler />
            </Suspense>
            <AuthStateListener />
            {children}
          </IntlProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
