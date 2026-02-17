"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

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
  source_unavailable?: boolean;
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

  // Форма добавления подарка
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemImageUrl, setNewItemImageUrl] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemAllowGroup, setNewItemAllowGroup] = useState(false);
  const [newItemTargetAmount, setNewItemTargetAmount] = useState("");
  const [newItemMinContribution, setNewItemMinContribution] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Редактирование подарка
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editAllowGroup, setEditAllowGroup] = useState(false);
  const [editTargetAmount, setEditTargetAmount] = useState("");
  const [editMinContribution, setEditMinContribution] = useState("");
  const [editSourceUnavailable, setEditSourceUnavailable] = useState(false);

  async function load() {
    const token = window.localStorage.getItem("token");
    if (!token) {
      setError("Необходимо войти");
      setLoading(false);
      return;
    }
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

  useEffect(() => {
    load();

    const ws = createWishlistSocket(wishlistId);
    ws.onmessage = () => {
      load();
    };

    return () => {
      ws.close();
    };
  }, [wishlistId]);

  async function fetchPreviewFromUrl() {
    const url = newItemUrl?.trim();
    if (!url || !url.startsWith("http")) {
      alert("Вставьте ссылку на товар в поле выше");
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await fetch(getApiUrl(`/preview?url=${encodeURIComponent(url)}`));
      if (!res.ok) throw new Error("Не удалось подтянуть данные");
      const data = (await res.json()) as { title?: string | null; image_url?: string | null; price_cents?: number | null };
      if (data.title) setNewItemTitle(data.title);
      if (data.image_url) setNewItemImageUrl(data.image_url);
      if (data.price_cents != null) setNewItemPrice((data.price_cents / 100).toFixed(0));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Ошибка. Введите данные вручную.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    const token = window.localStorage.getItem("token");
    if (!token) return;
    try {
      const price = newItemPrice ? Number(newItemPrice) * 100 : null;
      const target = newItemTargetAmount ? Number(newItemTargetAmount) * 100 : null;
      const minContrib = newItemMinContribution ? Number(newItemMinContribution) * 100 : null;

      const res = await fetch(getApiUrl(`/items/wishlist/${wishlistId}`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newItemTitle,
          url: newItemUrl || null,
          image_url: newItemImageUrl || null,
          price_cents: price,
          allow_group_funding: newItemAllowGroup,
          target_amount_cents: newItemAllowGroup ? (target || price) : null,
          min_contribution_cents: newItemAllowGroup ? (minContrib || Math.round((target || price || 0) * 0.1)) : null,
        }),
      });
      if (!res.ok) {
        throw new Error("Не удалось добавить подарок");
      }
      setNewItemTitle("");
      setNewItemUrl("");
      setNewItemImageUrl("");
      setNewItemPrice("");
      setNewItemAllowGroup(false);
      setNewItemTargetAmount("");
      setNewItemMinContribution("");
      await load();
    } catch (err: any) {
      alert(err.message || "Ошибка");
    }
  }

  function startEdit(item: Item) {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditUrl(item.url || "");
    setEditImageUrl(item.image_url || "");
    setEditPrice(item.price_cents ? (item.price_cents / 100).toString() : "");
    setEditAllowGroup(item.allow_group_funding);
    setEditTargetAmount(item.target_amount_cents ? (item.target_amount_cents / 100).toString() : "");
    setEditMinContribution(item.min_contribution_cents ? (item.min_contribution_cents / 100).toString() : "");
    setEditSourceUnavailable(item.source_unavailable ?? false);
  }

  async function handleToggleUnavailable(item: Item) {
    const msg = item.source_unavailable
      ? "Вернуть товар в список как доступный?"
      : "Пометить как недоступный? (Товар снят с продажи — участники сбора увидят уведомление)";
    if (!confirm(msg)) return;
    const token = window.localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(getApiUrl(`/items/${item.id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: item.title,
          url: item.url || null,
          image_url: item.image_url || null,
          price_cents: item.price_cents ?? null,
          allow_group_funding: item.allow_group_funding,
          target_amount_cents: item.target_amount_cents ?? null,
          min_contribution_cents: item.min_contribution_cents ?? null,
          source_unavailable: !item.source_unavailable,
        }),
      });
      if (!res.ok) throw new Error("Не удалось обновить");
      await load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Ошибка");
    }
  }

  async function handleUpdateItem() {
    if (!editingItem) return;
    const token = window.localStorage.getItem("token");
    if (!token) return;
    try {
      const price = editPrice ? Number(editPrice) * 100 : null;
      const target = editTargetAmount ? Number(editTargetAmount) * 100 : null;
      const minContrib = editMinContribution ? Number(editMinContribution) * 100 : null;

      const res = await fetch(getApiUrl(`/items/${editingItem.id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle,
          url: editUrl || null,
          image_url: editImageUrl || null,
          price_cents: price,
          allow_group_funding: editAllowGroup,
          target_amount_cents: editAllowGroup ? (target || price) : null,
          min_contribution_cents: editAllowGroup ? (minContrib || Math.round((target || price || 0) * 0.1)) : null,
          source_unavailable: editSourceUnavailable,
        }),
      });
      if (!res.ok) {
        throw new Error("Не удалось обновить подарок");
      }
      setEditingItem(null);
      await load();
    } catch (err: any) {
      alert(err.message || "Ошибка");
    }
  }

  async function handleDeleteItem(itemId: number) {
    if (!confirm("Удалить этот подарок?")) return;
    const token = window.localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(getApiUrl(`/items/${itemId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Не удалось удалить подарок");
      }
      await load();
    } catch (err: any) {
      alert(err.message || "Ошибка");
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-0 sm:px-0">
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
              {wishlist.description && <p className="mb-4 text-stone-600">{wishlist.description}</p>}
              <div className="rounded-xl bg-amber-50 p-4">
                <p className="mb-2 text-sm font-semibold text-stone-700">Публичная ссылка для друзей:</p>
                <code className="block break-all rounded-lg bg-white px-4 py-2 font-mono text-sm text-amber-800">
                  {typeof window !== "undefined" ? `${window.location.origin}/w/${wishlist.public_slug}` : `/w/${wishlist.public_slug}`}
                </code>
                <button
                  onClick={async () => {
                    const url = typeof window !== "undefined" ? `${window.location.origin}/w/${wishlist.public_slug}` : `/w/${wishlist.public_slug}`;
                    await navigator.clipboard.writeText(url);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  }}
                  className="mt-2 min-h-[44px] rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 active:bg-amber-800"
                >
                  {linkCopied ? "✓ Скопировано!" : "📋 Копировать ссылку"}
                </button>
              </div>
            </div>
          </header>

          {/* Форма добавления подарка */}
          <section className="card-glow mb-8 rounded-3xl bg-white/95 p-6 shadow-xl backdrop-blur-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-amber-900">
              <span>➕</span>
              <span>Добавить подарок</span>
            </h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  placeholder="Ссылка на товар — вставьте URL для автозаполнения"
                  type="url"
                  className="flex-1 rounded-xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 text-base transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                  value={newItemUrl}
                  onChange={(e) => setNewItemUrl(e.target.value)}
                />
                <button
                  type="button"
                  onClick={fetchPreviewFromUrl}
                  disabled={previewLoading || !newItemUrl?.trim()?.startsWith("http")}
                  className="flex-shrink-0 rounded-xl border-2 border-amber-400 bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-900 transition-all hover:bg-amber-200 disabled:opacity-50 disabled:hover:bg-amber-100"
                >
                  {previewLoading ? "⏳ Загружаем..." : "✨ Подтянуть по ссылке"}
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  placeholder="Название подарка *"
                  className="rounded-xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 text-base transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  required
                />
                <input
                  placeholder="Цена, ₽"
                  type="number"
                  min="0"
                  className="rounded-xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 text-base transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                />
              </div>
              <input
                placeholder="URL картинки (если не подтянулось)"
                type="url"
                className="w-full rounded-xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 text-base transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                value={newItemImageUrl}
                onChange={(e) => setNewItemImageUrl(e.target.value)}
              />
              <label className="flex items-start gap-3 rounded-xl border-2 border-amber-200 bg-amber-50/30 p-4">
                <input
                  type="checkbox"
                  checked={newItemAllowGroup}
                  onChange={(e) => setNewItemAllowGroup(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-amber-300 text-amber-600 focus:ring-amber-400"
                />
                <div className="flex-1">
                  <span className="block font-semibold text-stone-700">Разрешить скидываться</span>
                  <span className="mt-1 block text-xs text-stone-600">
                    Несколько друзей смогут скинуться на этот подарок вместе
                  </span>
                </div>
              </label>
              {newItemAllowGroup && (
                <div className="space-y-3 rounded-xl border-2 border-amber-200 bg-amber-50/30 p-4">
                  <input
                    placeholder="Целевая сумма, ₽ (по умолчанию = цена)"
                    type="number"
                    min="0"
                    className="w-full rounded-xl border-2 border-amber-200 bg-white px-4 py-2 text-sm transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    value={newItemTargetAmount}
                    onChange={(e) => setNewItemTargetAmount(e.target.value)}
                  />
                  <input
                    placeholder="Минимальный вклад, ₽ (по умолчанию 10% от цели)"
                    type="number"
                    min="0"
                    className="w-full rounded-xl border-2 border-amber-200 bg-white px-4 py-2 text-sm transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    value={newItemMinContribution}
                    onChange={(e) => setNewItemMinContribution(e.target.value)}
                  />
                </div>
              )}
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                Добавить подарок
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
                className={`card-glow rounded-2xl bg-white/95 p-6 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl ${item.source_unavailable ? "opacity-90" : ""}`}
              >
                {item.source_unavailable && (
                  <div className="mb-4 rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
                    ⚠️ Товар снят с продажи — на него уже скидывались. Участники видят это уведомление.
                  </div>
                )}
                <div className="flex flex-col gap-4 sm:flex-row">
                  {item.image_url && (
                    <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-xl">
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="flex-1">
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

                    {/* Кнопки управления */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded-xl border-2 border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-50"
                      >
                        ✏️ Редактировать
                      </button>
                      <button
                        onClick={() => handleToggleUnavailable(item)}
                        className="rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100"
                      >
                        {item.source_unavailable ? "✓ Вернуть в список" : "⚠️ Товар сняли"}
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="rounded-xl border-2 border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
                      >
                        🗑️ Удалить
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>

          {/* Модалка редактирования */}
          {editingItem && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
              <div className="card-glow max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-h-none sm:rounded-3xl">
                <h3 className="mb-4 text-xl font-bold text-amber-900">Редактировать подарок</h3>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      placeholder="Название *"
                      className="rounded-xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 text-base transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                    />
                    <input
                      placeholder="Цена, ₽"
                      type="number"
                      min="0"
                      className="rounded-xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 text-base transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                    />
                  </div>
                  <input
                    placeholder="Ссылка на магазин"
                    type="url"
                    className="w-full rounded-xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 text-base transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                  />
                  <input
                    placeholder="URL картинки"
                    type="url"
                    className="w-full rounded-xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 text-base transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                  />
                  <label className="flex items-start gap-3 rounded-xl border-2 border-amber-200 bg-amber-50/30 p-4">
                    <input
                      type="checkbox"
                      checked={editAllowGroup}
                      onChange={(e) => setEditAllowGroup(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-amber-300 text-amber-600 focus:ring-amber-400"
                    />
                    <span className="font-semibold text-stone-700">Разрешить скидываться</span>
                  </label>
                  <label className="flex items-start gap-3 rounded-xl border-2 border-amber-200 bg-amber-50/30 p-4">
                    <input
                      type="checkbox"
                      checked={editSourceUnavailable}
                      onChange={(e) => setEditSourceUnavailable(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-amber-300 text-amber-600 focus:ring-amber-400"
                    />
                    <div>
                      <span className="font-semibold text-stone-700">Товар снят с продажи</span>
                      <span className="mt-1 block text-xs text-stone-600">
                        Показать участникам, что товар больше недоступен в магазине
                      </span>
                    </div>
                  </label>
                  {editAllowGroup && (
                    <div className="space-y-3 rounded-xl border-2 border-amber-200 bg-amber-50/30 p-4">
                      <input
                        placeholder="Целевая сумма, ₽"
                        type="number"
                        min="0"
                        className="w-full rounded-xl border-2 border-amber-200 bg-white px-4 py-2 text-sm transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                        value={editTargetAmount}
                        onChange={(e) => setEditTargetAmount(e.target.value)}
                      />
                      <input
                        placeholder="Минимальный вклад, ₽"
                        type="number"
                        min="0"
                        className="w-full rounded-xl border-2 border-amber-200 bg-white px-4 py-2 text-sm transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                        value={editMinContribution}
                        onChange={(e) => setEditMinContribution(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditingItem(null)}
                      className="flex-1 rounded-xl border-2 border-amber-300 bg-white px-4 py-3 font-semibold text-amber-800 transition-colors hover:bg-amber-50"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleUpdateItem}
                      className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
