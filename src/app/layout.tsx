import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:       "Trackr — Personal Finance",
  description: "Track income, expenses, lending, borrowing, budgets and more.",
  themeColor:  "#1E2B3C",
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
