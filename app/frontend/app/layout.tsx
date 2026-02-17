import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "Подарки и желания — Социальный вишлист",
  description: "Создавайте списки желаний, делитесь с друзьями, резервируйте подарки и скидывайтесь вместе",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen text-stone-800 antialiased">
        <header className="sticky top-0 z-50 border-b border-amber-200/40 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-md shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-6 sm:py-4">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-2 text-lg font-bold text-amber-900 transition-colors hover:text-amber-700 sm:text-xl"
            >
              <span className="text-2xl">🎁</span>
              <span>Подарки и желания</span>
            </Link>
            <nav className="flex flex-shrink-0 items-center gap-2 text-sm sm:gap-3">
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
        <main className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-6 sm:py-8">{children}</main>
      </body>
    </html>
  );
}

