import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rovanta.io | Intelligent Workflow Automation",
  description: "AI-powered workflow automation for modern business operations."
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
