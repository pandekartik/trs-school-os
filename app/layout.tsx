import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Poppins, Kumbh_Sans } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

const kumbhSans = Kumbh_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-kumbh",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TRS School OS",
  description: "The Rosary School — Internal Operations Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${poppins.variable} ${kumbhSans.variable}`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}