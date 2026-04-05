import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Keipr - Paycheck-Forward Budgeting",
  description: "Budget around your paychecks, not the calendar. Smart bill tracking and paycheck-forward planning.",
  metadataBase: new URL("https://keipr.app"),
  openGraph: {
    title: "Keipr - Paycheck-Forward Budgeting",
    description: "Budget around your paychecks, not the calendar. Smart bill tracking and paycheck-forward planning.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
