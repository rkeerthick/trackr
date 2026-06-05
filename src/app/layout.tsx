import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#1E2B3C",
};

export const metadata: Metadata = {
  title:       "Trackr — Personal Finance",
  description: "Track income, expenses, lending, borrowing, budgets and more.",
  icons: {
    icon:        "/favicon.svg",
    shortcut:    "/favicon.svg",
    apple:       "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
