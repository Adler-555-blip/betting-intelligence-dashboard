import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Betting Intelligence Dashboard",
  description: "Аналитический дашборд для матчей CS2, Dota 2 и футбола."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-terminal-bg text-terminal-text antialiased">
        <div className="border-b border-terminal-border bg-terminal-panel">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
            <Link href="/" className="font-semibold tracking-wide">
              Betting Intelligence
            </Link>
            <div className="flex gap-4 text-sm text-terminal-muted">
              <Link href="/" className="hover:text-terminal-text">Сегодня</Link>
              <Link href="/decision-factors" className="hover:text-terminal-text">Карта факторов</Link>
              <Link href="/edge-tracking" className="hover:text-terminal-text">Трекинг edges</Link>
              <Link href="/journal" className="hover:text-terminal-text">Журнал</Link>
              <Link href="/analytics" className="hover:text-terminal-text">Аналитика</Link>
            </div>
          </nav>
        </div>
        <main className="mx-auto max-w-7xl px-5 py-6">{children}</main>
      </body>
    </html>
  );
}
