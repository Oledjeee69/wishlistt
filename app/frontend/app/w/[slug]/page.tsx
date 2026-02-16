"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getApiUrl } from "@/lib/api";

interface Contribution {
  id: number;
  amount_cents: number;
  contributor_name: string | null;
  is_anonymous: boolean;
}

interface Reservation {
  id: number;
  reserver_name: string;
  message?: string | null;
  is_group: boolean;
  created_at: string;
  contributions: Contribution[];
}

interface PublicItem {
  id: number;
  title: string;
  url?: string | null;
  image_url?: string | null;
  price_cents?: number | null;
  allow_group_funding: boolean;
  target_amount_cents?: number | null;
  min_contribution_cents?: number | null;
  reservations: Reservation[];
  collected_amount_cents: number;
}

interface PublicWishlist {
  id: number;
  title: string;
  description?: string | null;
  event_date?: string | null;
  public_slug: string;
  items: PublicItem[];
}

export default function PublicWishlistPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [wishlist, setWishlist] = useState<PublicWishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(getApiUrl(`/wishlists/public/${slug}`));
        if (!res.ok) {
          throw new Error("Вишлист не найден");
        }
        const data = (await res.json()) as PublicWishlist;
        setWishlist(data);
      } catch (err: any) {
        setError(err.message || "Ошибка");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  return (
    <main className="mx-auto max-w-4xl">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-stone-600">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span>Загружаем вишлист...</span>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="card-glow rounded-3xl border-2 border-red-200 bg-red-50 p-8 text-center">
          <div className="mb-4 text-5xl">😕</div>
          <h2 className="mb-2 text-2xl font-bold text-red-700">Вишлист не найден</h2>
          <p className="text-stone-600">{error}</p>
        </div>
      )}

      {wishlist && (
        <>
          {/* Заголовок */}
          <header className="mb-8">
            <div className="card-glow rounded-3xl bg-white/95 p-8 shadow-xl backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-3xl shadow-lg">
                  🎁
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-amber-900">{wishlist.title}</h1>
                  {wishlist.description && (
                    <p className="mt-2 text-stone-600">{wishlist.description}</p>
                  )}
                </div>
              </div>
              <div className="rounded-xl bg-amber-50/80 p-4 text-sm text-stone-700">
                <span className="mr-2">💡</span>
                Этот список можно просматривать без регистрации. Выберите подарок, чтобы зарезервировать его или скинуться на него вместе с другими.
              </div>
            </div>
          </header>

          {/* Список подарков */}
          <section className="space-y-6">
            {wishlist.items.length === 0 && (
              <div className="card-glow rounded-3xl border-2 border-dashed border-amber-300 bg-white/90 p-12 text-center backdrop-blur-sm">
                <div className="mb-4 text-6xl">📦</div>
                <h3 className="mb-2 text-xl font-bold text-amber-900">Пока нет подарков</h3>
                <p className="text-stone-600">
                  Возможно, владелец ещё заполняет список. Загляните позже!
                </p>
              </div>
            )}

            {wishlist.items.map((item) => {
              const isReserved = item.reservations.length > 0 && !item.allow_group_funding;
              const totalTarget = item.target_amount_cents;
              const collected = item.collected_amount_cents;
              const progress =
                totalTarget && totalTarget > 0
                  ? Math.min(100, Math.round((collected / totalTarget) * 100))
                  : 0;

              return (
                <article
                  key={item.id}
                  className={`card-glow rounded-2xl bg-white/95 p-6 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl ${
                    isReserved && !item.allow_group_funding ? "opacity-75" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="mb-2 text-xl font-bold text-amber-900">{item.title}</h2>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 transition-colors hover:text-amber-900"
                        >
                          <span>🔗</span>
                          <span>Открыть в магазине</span>
                        </a>
                      )}
                    </div>
                    {typeof item.price_cents === "number" && (
                      <div className="rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 px-5 py-3 text-right">
                        <div className="text-2xl font-bold text-amber-900">
                          {(item.price_cents / 100).toFixed(0)} ₽
                        </div>
                        {item.allow_group_funding && totalTarget && (
                          <div className="mt-1 text-xs text-stone-600">
                            Цель: {(totalTarget / 100).toFixed(0)} ₽
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Прогресс-бар для группового сбора */}
                  {item.allow_group_funding && totalTarget && (
                    <div className="mt-4 rounded-xl bg-amber-50/50 p-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-semibold text-stone-700">Прогресс сбора</span>
                        <span className="font-bold text-amber-900">
                          {(collected / 100).toFixed(0)} ₽ из {(totalTarget / 100).toFixed(0)} ₽
                        </span>
                      </div>
                      <div className="h-4 w-full overflow-hidden rounded-full bg-white shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-stone-600">
                        {progress >= 100 ? "✅ Цель достигнута!" : `Осталось собрать ${((totalTarget - collected) / 100).toFixed(0)} ₽`}
                      </p>
                    </div>
                  )}

                  {/* Статус резервации */}
                  {!item.allow_group_funding && (
                    <div className={`mt-4 rounded-xl p-4 ${isReserved ? "bg-red-50" : "bg-emerald-50"}`}>
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <span>{isReserved ? "🔒" : "✅"}</span>
                        <span className={isReserved ? "text-red-700" : "text-emerald-700"}>
                          {isReserved
                            ? "Этот подарок уже кто‑то зарезервировал"
                            : "Никто ещё не резервировал этот подарок — вы можете быть первым"}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Участники группового сбора */}
                  {item.allow_group_funding && item.reservations.length > 0 && (
                    <div className="mt-4 rounded-xl bg-amber-50/50 p-4">
                      <p className="mb-3 text-sm font-semibold text-stone-700">Участники сбора:</p>
                      <div className="space-y-2">
                        {item.reservations.map((r) => (
                          <div key={r.id} className="flex items-center gap-2 rounded-lg bg-white p-2 text-sm">
                            <span className="font-medium text-amber-900">{r.reserver_name}</span>
                            <span className="text-stone-500">
                              {r.is_group ? "участвует в сборе" : "зарезервировал(-а) подарок"}
                            </span>
                            {r.message && (
                              <span className="text-stone-400">— {r.message}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}

