"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getApiUrl } from "@/lib/api";

interface Wishlist {
  id: number;
  title: string;
  description?: string | null;
  public_slug: string;
}

export default function DashboardPage() {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (!token) {
      setError("Необходимо войти");
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const res = await fetch(getApiUrl("/wishlists/me"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error("Не удалось загрузить вишлисты");
        }
        const data = (await res.json()) as Wishlist[];
        setWishlists(data);
      } catch (err: any) {
        setError(err.message || "Ошибка");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main className="mx-auto max-w-5xl">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-900">Мои вишлисты</h1>
          <p className="mt-1 text-stone-600">Управляйте списками желаний и делитесь ими с друзьями</p>
        </div>
        <Link
          href="/wishlist/new"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        >
          <span className="text-xl">+</span>
          <span>Новый вишлист</span>
        </Link>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-stone-600">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span>Загружаем ваши вишлисты...</span>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6 text-center">
          <p className="font-semibold text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && wishlists.length === 0 && (
        <div className="card-glow rounded-3xl border-2 border-dashed border-amber-300 bg-white/90 p-12 text-center backdrop-blur-sm">
          <div className="mb-4 text-6xl">📝</div>
          <h2 className="mb-2 text-2xl font-bold text-amber-900">Здесь пока нет вишлистов</h2>
          <p className="mb-6 text-stone-600">
            Создайте первый список желаний, добавьте подарки и поделитесь ссылкой с друзьями.
          </p>
          <Link
            href="/wishlist/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            <span>✨</span>
            <span>Создать первый вишлист</span>
          </Link>
        </div>
      )}

      {!loading && !error && wishlists.length > 0 && (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wishlists.map((wl) => (
            <article
              key={wl.id}
              className="card-glow group relative flex flex-col rounded-2xl bg-white/95 p-6 shadow-lg backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-xl"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-amber-900">{wl.title}</h2>
                  {wl.description && (
                    <p className="mt-2 text-sm text-stone-600 line-clamp-2">{wl.description}</p>
                  )}
                </div>
                <div className="ml-2 text-2xl">🎁</div>
              </div>

              <div className="mt-auto space-y-3">
                <div className="rounded-lg bg-amber-50 p-3">
                  <p className="mb-1 text-xs font-semibold text-stone-500">Публичная ссылка</p>
                  <code className="block truncate rounded bg-white px-2 py-1 text-xs font-mono text-amber-800">
                    /w/{wl.public_slug}
                  </code>
                </div>

                <Link
                  href={`/wishlist/${wl.id}`}
                  className="block w-full rounded-xl border-2 border-amber-300 bg-white px-4 py-3 text-center text-sm font-semibold text-amber-800 transition-all hover:border-amber-400 hover:bg-amber-50"
                >
                  Открыть список →
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

