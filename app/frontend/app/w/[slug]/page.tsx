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
    <main className="mx-auto flex max-w-3xl flex-col gap-5 py-8 text-sm">
      {loading && <p className="text-slate-500">Загружаем...</p>}
      {error && !loading && <p className="text-red-600">{error}</p>}
      {wishlist && (
        <>
          <header className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">{wishlist.title}</h1>
            {wishlist.description && (
              <p className="text-xs text-slate-600">{wishlist.description}</p>
            )}
            <p className="text-xs text-slate-500">
              Этот список можно просматривать без регистрации. Выберите подарок,
              чтобы зарезервировать его или скинуться на него вместе с другими.
            </p>
          </header>
          <section className="flex flex-col gap-3">
            {wishlist.items.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-600">
                В этом вишлисте пока нет подарков. Возможно, владелец ещё
                заполняет его.
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
                  className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold">{item.title}</h2>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex text-xs text-indigo-600 hover:underline"
                        >
                          Открыть в магазине
                        </a>
                      )}
                    </div>
                    {typeof item.price_cents === "number" && (
                      <div className="text-right text-xs text-slate-600">
                        <div className="font-semibold">
                          {(item.price_cents / 100).toFixed(0)} ₽
                        </div>
                        {item.allow_group_funding && totalTarget && (
                          <div>
                            Цель: {(totalTarget / 100).toFixed(0)} ₽
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {item.allow_group_funding && totalTarget && (
                    <div className="mt-1">
                      <div className="mb-1 flex justify-between text-[11px] text-slate-600">
                        <span>Сбор</span>
                        <span>
                          {(collected / 100).toFixed(0)} ₽ из{" "}
                          {(totalTarget / 100).toFixed(0)} ₽
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {!item.allow_group_funding && (
                    <p className="mt-1 text-[11px] text-slate-600">
                      {isReserved
                        ? "Этот подарок уже кто‑то зарезервировал."
                        : "Никто ещё не резервировал этот подарок — вы можете быть первым."}
                    </p>
                  )}

                  {item.allow_group_funding && item.reservations.length > 0 && (
                    <div className="mt-2 space-y-1 rounded-md bg-slate-50 p-2 text-[11px] text-slate-600">
                      {item.reservations.map((r) => (
                        <div key={r.id}>
                          <span className="font-medium">{r.reserver_name}</span>{" "}
                          {r.is_group ? "участвует в сборе" : "зарезервировал(-а) подарок"}
                          {r.message && <> — {r.message}</>}
                        </div>
                      ))}
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

