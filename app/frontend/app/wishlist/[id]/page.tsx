"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { createWishlistSocket } from "@/lib/ws";
import { getApiUrl } from "@/lib/api";

interface Item {
  id: number;
  title: string;
  url?: string | null;
  image_url?: string | null;
  price_cents?: number | null;
  allow_group_funding: boolean;
  target_amount_cents?: number | null;
  min_contribution_cents?: number | null;
  reserved_count: number;
  collected_amount_cents: number;
}

interface WishlistDetail {
  id: number;
  title: string;
  description?: string | null;
  event_date?: string | null;
  public_slug: string;
  is_public: boolean;
  items: Item[];
}

export default function WishlistOwnerPage() {
  const params = useParams<{ id: string }>();
  const wishlistId = Number(params.id);
  const [wishlist, setWishlist] = useState<WishlistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (!token) {
      setError("Необходимо войти");
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const res = await fetch(getApiUrl(`/wishlists/${wishlistId}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error("Не удалось загрузить вишлист");
        }
        const data = (await res.json()) as WishlistDetail;
        setWishlist(data);
      } catch (err: any) {
        setError(err.message || "Ошибка");
      } finally {
        setLoading(false);
      }
    }
    load();

    const ws = createWishlistSocket(wishlistId);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as { type: string };
        if (
          msg.type === "item_created" ||
          msg.type === "item_updated" ||
          msg.type === "item_deleted" ||
          msg.type === "item_reserved" ||
          msg.type === "contribution_added"
        ) {
          // на каждое событие просто перезагружаем детали списка
          load();
        }
      } catch {
        // игнорируем
      }
    };

    return () => {
      ws.close();
    };
  }, [wishlistId]);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    const token = window.localStorage.getItem("token");
    if (!token) {
      setError("Необходимо войти");
      return;
    }
    try {
      const res = await fetch(getApiUrl(`/items/wishlist/${wishlistId}`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newItemTitle,
          url: newItemUrl || null,
          price_cents: newItemPrice ? Number(newItemPrice) * 100 : null,
          allow_group_funding: false,
        }),
      });
      if (!res.ok) {
        throw new Error("Не удалось добавить подарок");
      }
      const created = (await res.json()) as Item;
      setWishlist((prev) =>
        prev ? { ...prev, items: [...prev.items, { ...created, reserved_count: 0, collected_amount_cents: 0 }] } : prev,
      );
      setNewItemTitle("");
      setNewItemUrl("");
      setNewItemPrice("");
    } catch (err: any) {
      setError(err.message || "Ошибка");
    }
  }

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
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6 text-center">
          <p className="font-semibold text-red-700">{error}</p>
        </div>
      )}

      {wishlist && (
        <>
          {/* Заголовок */}
          <header className="mb-8">
            <div className="card-glow rounded-3xl bg-white/95 p-6 shadow-xl backdrop-blur-sm">
              <h1 className="mb-2 text-3xl font-bold text-amber-900">{wishlist.title}</h1>
              {wishlist.description && (
                <p className="mb-4 text-stone-600">{wishlist.description}</p>
              )}
              <div className="rounded-xl bg-amber-50 p-4">
                <p className="mb-2 text-sm font-semibold text-stone-700">Публичная ссылка для друзей:</p>
                <code className="block rounded-lg bg-white px-4 py-2 font-mono text-sm text-amber-800">
                  /w/{wishlist.public_slug}
                </code>
              </div>
            </div>
          </header>

          {/* Форма добавления подарка */}
          <section className="card-glow mb-8 rounded-3xl bg-white/95 p-6 shadow-xl backdrop-blur-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-amber-900">
              <span>➕</span>
              <span>Добавить подарок</span>
            </h2>
            <p className="mb-4 text-stone-600">
              Добавьте подарки — друзья увидят этот список по ссылке и смогут зарезервировать подарки или скинуться на дорогие.
            </p>
            <form onSubmit={handleAddItem} className="grid gap-4 sm:grid-cols-[2fr,2fr,1fr,auto]">
              <input
                placeholder="Название подарка"
                className="rounded-xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 text-base transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                required
              />
              <input
                placeholder="Ссылка на магазин"
                className="rounded-xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 text-base transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                value={newItemUrl}
                onChange={(e) => setNewItemUrl(e.target.value)}
              />
              <input
                placeholder="Цена, ₽"
                type="number"
                min="0"
                className="rounded-xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 text-base transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
              />
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                Добавить
              </button>
            </form>
          </section>

          {/* Список подарков */}
          <section className="space-y-4">
            {wishlist.items.length === 0 && (
              <div className="card-glow rounded-3xl border-2 border-dashed border-amber-300 bg-white/90 p-12 text-center backdrop-blur-sm">
                <div className="mb-4 text-6xl">🎁</div>
                <h3 className="mb-2 text-xl font-bold text-amber-900">Пока нет подарков</h3>
                <p className="text-stone-600">
                  Добавьте первый подарок — ссылка уже готова, можно отправлять друзьям.
                </p>
              </div>
            )}

            {wishlist.items.map((item) => (
              <article
                key={item.id}
                className="card-glow rounded-2xl bg-white/95 p-6 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl"
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
                    <div className="rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 px-4 py-3 text-right">
                      <div className="text-2xl font-bold text-amber-900">
                        {(item.price_cents / 100).toFixed(0)} ₽
                      </div>
                      {item.allow_group_funding && item.target_amount_cents && (
                        <div className="mt-1 text-xs text-stone-600">
                          Цель: {(item.target_amount_cents / 100).toFixed(0)} ₽
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Статистика */}
                <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-amber-50/50 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📌</span>
                    <span className="text-sm font-semibold text-stone-700">
                      Резервов: <span className="text-amber-900">{item.reserved_count}</span>
                    </span>
                  </div>
                  {item.allow_group_funding && item.target_amount_cents && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💰</span>
                      <span className="text-sm font-semibold text-stone-700">
                        Собрано: <span className="text-amber-900">
                          {(item.collected_amount_cents / 100).toFixed(0)} ₽
                        </span> из{" "}
                        <span className="text-amber-900">
                          {(item.target_amount_cents / 100).toFixed(0)} ₽
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  );
}

