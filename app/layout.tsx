import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Betting Intelligence Dashboard",
  description: "Personal CS2 and Dota 2 odds monitoring and decision journal."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-terminal-bg text-terminal-text">
        <div className="border-b border-terminal-border bg-terminal-panel">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
            <Link href="/" className="font-semibold tracking-wide">
              Betting Intelligence
            </Link>
            <div className="flex gap-4 text-sm text-terminal-muted">
              <Link href="/" className="hover:text-terminal-text">Today</Link>
              <Link href="/journal" className="hover:text-terminal-text">Journal</Link>
              <Link href="/analytics" className="hover:text-terminal-text">Analytics</Link>
            </div>
          </nav>
        </div>
        <main className="mx-auto max-w-7xl px-5 py-6">{children}</main>
      </body>
    </html>
  );
}
