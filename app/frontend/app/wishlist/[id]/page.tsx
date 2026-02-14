"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { createWishlistSocket } from "../../../lib/ws";
import { getApiUrl } from "../../../lib/api";

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
              Публичная ссылка:{" "}
              <code className="rounded bg-slate-100 px-1">
                /w/{wishlist.public_slug}
              </code>
            </p>
          </header>

          <section className="rounded-lg border border-dashed border-slate-300 bg-white p-4">
            <p className="text-xs text-slate-600">
              Добавьте подарки — друзья увидят этот список по ссылке и смогут
              зарезервировать подарки или скинуться на дорогие.
            </p>
            <form
              onSubmit={handleAddItem}
              className="mt-3 grid gap-3 md:grid-cols-[2fr,2fr,1fr,auto]"
            >
              <input
                placeholder="Название подарка"
                className="rounded-md border border-slate-300 px-3 py-2"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                required
              />
              <input
                placeholder="Ссылка на магазин"
                className="rounded-md border border-slate-300 px-3 py-2"
                value={newItemUrl}
                onChange={(e) => setNewItemUrl(e.target.value)}
              />
              <input
                placeholder="Цена, ₽"
                className="rounded-md border border-slate-300 px-3 py-2"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
              />
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700"
              >
                Добавить
              </button>
            </form>
          </section>

          <section className="mt-2 flex flex-col gap-3">
            {wishlist.items.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-600">
                В этом вишлисте пока нет подарков. Добавьте первый подарок — ссылка
                уже готова, можно отправлять друзьям.
              </div>
            )}
            {wishlist.items.map((item) => (
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
                      {item.allow_group_funding && item.target_amount_cents && (
                        <div>
                          Сбор: {(item.target_amount_cents / 100).toFixed(0)} ₽
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>Резервов: {item.reserved_count}</span>
                  {item.allow_group_funding && item.target_amount_cents && (
                    <span>
                      Собрано: {(item.collected_amount_cents / 100).toFixed(0)} ₽ из{" "}
                      {(item.target_amount_cents / 100).toFixed(0)} ₽
                    </span>
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

