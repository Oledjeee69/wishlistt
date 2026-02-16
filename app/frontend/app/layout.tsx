import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "Подарки и желания — Социальный вишлист",
  description: "Создавайте списки желаний, делитесь с друзьями, резервируйте подарки и скидывайтесь вместе",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen text-stone-800 antialiased">
        <header className="sticky top-0 z-50 border-b border-amber-200/40 bg-white/90 backdrop-blur-md shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold text-amber-900 transition-colors hover:text-amber-700"
            >
              <span className="text-2xl">🎁</span>
              <span>Подарки и желания</span>
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link
                href="/auth/login"
                className="rounded-lg px-4 py-2 font-medium text-amber-800 transition-colors hover:bg-amber-50 hover:text-amber-900"
              >
                Войти
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg"
              >
                Регистрация
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}

