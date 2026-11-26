import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE } from "@/data/experiments";

// Inter: the films' own typeface (v1, v3). v2 uses the system serif; no other web fonts.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: { title: SITE.name, description: SITE.description, type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
