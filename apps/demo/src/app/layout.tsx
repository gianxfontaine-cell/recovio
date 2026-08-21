import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recovio Demo",
  description: "Invalid retailer deduction recovery demo"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex min-h-screen max-w-7xl gap-6 p-6">
          <aside className="hidden w-64 shrink-0 rounded-2xl border border-white/10 bg-slate-900/70 p-5 md:block">
            <div className="text-2xl font-bold tracking-tight">Recovio</div>
            <p className="mt-1 text-sm text-slate-400">
              Deduction recovery demo
            </p>

            <nav className="mt-8 space-y-2 text-sm">
              <Link
                href="/"
                className="block rounded-lg px-3 py-2 font-medium hover:bg-white/10"
              >
                Command Center
              </Link>
              <Link
                href="/deductions"
                className="block rounded-lg px-3 py-2 text-slate-400 hover:bg-white/5 hover:text-slate-200"
              >
                Deductions
              </Link>
              <Link
                href="/analytics"
                className="block rounded-lg px-3 py-2 text-slate-400 hover:bg-white/5 hover:text-slate-200"
              >
                Analytics
              </Link>
              <span className="block px-3 py-2 text-slate-400">
                Rules
              </span>
            </nav>
          </aside>

          <main className="w-full">{children}</main>
        </div>
      </body>
    </html>
  );
}
