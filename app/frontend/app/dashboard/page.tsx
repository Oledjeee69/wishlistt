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
    <main className="mx-auto max-w-3xl">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-amber-900">Мои вишлисты</h1>
        <Link
          href="/wishlist/new"
          className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
        >
          + Новый вишлист
        </Link>
      </header>
      {loading && <p className="mt-4 text-sm text-stone-500">Загружаем...</p>}
      {error && !loading && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      {!loading && !error && wishlists.length === 0 && (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-amber-200 bg-white/80 p-8 text-center text-stone-600">
          <p className="font-medium">Здесь пока нет вишлистов</p>
          <p className="mt-2 text-sm">
            Создайте первый список желаний, добавьте подарки и поделитесь ссылкой с друзьями.
          </p>
          <Link
            href="/wishlist/new"
            className="mt-4 inline-block rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Создать первый вишлист
          </Link>
        </div>
      )}
      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {wishlists.map((wl) => (
          <article
            key={wl.id}
            className="flex flex-col justify-between rounded-2xl border border-amber-100 bg-white/90 p-5 shadow-md shadow-amber-900/5"
          >
            <div>
              <h2 className="text-lg font-semibold text-amber-900">{wl.title}</h2>
              {wl.description && (
                <p className="mt-1 text-sm text-stone-600">{wl.description}</p>
              )}
            </div>
            <div className="mt-4 flex flex-col gap-2 text-xs text-stone-500">
              <span>
                Ссылка для друзей: <code className="rounded bg-amber-50 px-1.5 py-0.5">/w/{wl.public_slug}</code>
              </span>
              <Link
                href={`/wishlist/${wl.id}`}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm font-medium text-amber-800 hover:bg-amber-100"
              >
                Открыть список
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

