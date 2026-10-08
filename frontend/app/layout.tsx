import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Typeform Clone",
  description: "Typeform-like form builder dashboard"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
