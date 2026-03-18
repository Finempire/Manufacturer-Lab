import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "CashFlow - Order to Payment Management",
  description: "Enterprise petty cash and order-to-payment management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      <body className="font-sans antialiased bg-surface-0 text-foreground">
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            duration={3000}
            richColors
            theme="dark"
            toastOptions={{
              style: {
                background: 'var(--surface-2)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
