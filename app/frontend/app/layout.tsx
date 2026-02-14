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
      <body className="min-h-screen text-stone-800">
        <header className="border-b border-amber-200/60 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-semibold text-amber-800">
              Подарки и желания
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/auth/login" className="text-amber-800 hover:underline">
                Войти
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-amber-600 px-3 py-1.5 font-medium text-white hover:bg-amber-700"
              >
                Регистрация
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

