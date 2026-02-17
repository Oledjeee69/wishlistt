"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

import { getApiUrl } from "@/lib/api";
import { createWishlistSocket } from "@/lib/ws";

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
  source_unavailable?: boolean;
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

  // Модалки
  const [reserveModalItem, setReserveModalItem] = useState<PublicItem | null>(null);
  const [contributeModalItem, setContributeModalItem] = useState<PublicItem | null>(null);
  const [reserveName, setReserveName] = useState("");
  const [reserveMessage, setReserveMessage] = useState("");
  const [contributeName, setContributeName] = useState("");
  const [contributeAmount, setContributeAmount] = useState("");
  const [contributeAnonymous, setContributeAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  async function loadWishlist() {
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

  useEffect(() => {
    loadWishlist();
  }, [slug]);

  useEffect(() => {
    if (!wishlist) return;
    const ws = createWishlistSocket(wishlist.id);
    ws.onmessage = async () => {
      await loadWishlist();
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 2000);
    };
    return () => ws.close();
  }, [wishlist?.id]);

  async function handleReserve() {
    if (!reserveModalItem || !reserveName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(getApiUrl(`/items/${reserveModalItem.id}/reserve`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reserver_name: reserveName.trim(),
          message: reserveMessage.trim() || null,
          is_group: false,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Не удалось зарезервировать");
      }
      setReserveModalItem(null);
      setReserveName("");
      setReserveMessage("");
      await loadWishlist();
    } catch (err: any) {
      alert(err.message || "Ошибка");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleContribute() {
    if (!contributeModalItem || !contributeName.trim() || !contributeAmount) return;
    const amountCents = Math.round(Number(contributeAmount) * 100);
    if (amountCents <= 0) {
      alert("Введите корректную сумму");
      return;
    }
    const min = contributeModalItem.min_contribution_cents || 0;
    if (min > 0 && amountCents < min) {
      alert(`Минимальный вклад: ${(min / 100).toFixed(0)} ₽`);
      return;
    }
    const target = contributeModalItem.target_amount_cents || contributeModalItem.price_cents || 0;
    const remaining = target - contributeModalItem.collected_amount_cents;
    if (amountCents > remaining) {
      alert(`Максимальный вклад: ${(remaining / 100).toFixed(0)} ₽`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(getApiUrl(`/items/${contributeModalItem.id}/contributions`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributor_name: contributeName.trim(),
          amount_cents: amountCents,
          is_anonymous: contributeAnonymous,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Не удалось внести вклад");
      }
      setContributeModalItem(null);
      setContributeName("");
      setContributeAmount("");
      setContributeAnonymous(false);
      await loadWishlist();
    } catch (err: any) {
      alert(err.message || "Ошибка");
    } finally {
      setSubmitting(false);
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
        <div className="card-glow rounded-3xl border-2 border-red-200 bg-red-50 p-8 text-center">
          <div className="mb-4 text-5xl">😕</div>
          <h2 className="mb-2 text-2xl font-bold text-red-700">Вишлист не найден</h2>
          <p className="text-stone-600">{error}</p>
        </div>
      )}

      {wishlist && (
        <>
          {justUpdated && (
            <div className="mb-4 animate-fade-in rounded-xl bg-emerald-100 px-4 py-2 text-center text-sm font-semibold text-emerald-800">
              ✨ Обновлено — изменения видны всем в реальном времени
            </div>
          )}
          {/* Заголовок */}
          <header className="mb-8">
            <div className="card-glow rounded-3xl bg-white/95 p-8 shadow-xl backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-3xl shadow-lg">
                  🎁
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-amber-900">{wishlist.title}</h1>
                  {wishlist.description && (
                    <p className="mt-2 text-stone-600">{wishlist.description}</p>
                  )}
                  {wishlist.event_date && (
                    <p className="mt-2 text-sm text-stone-500">
                      📅 Дата события: {new Date(wishlist.event_date).toLocaleDateString("ru-RU", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
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
              const remaining = totalTarget ? totalTarget - collected : 0;
              const progress =
                totalTarget && totalTarget > 0
                  ? Math.min(100, Math.round((collected / totalTarget) * 100))
                  : 0;
              const isFullyFunded = progress >= 100;

              return (
                <article
                  key={item.id}
                  className={`card-glow rounded-2xl bg-white/95 p-6 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl ${
                    isReserved && !item.allow_group_funding ? "opacity-75" : ""
                  } ${item.source_unavailable ? "opacity-90" : ""}`}
                >
                  {item.source_unavailable && (
                    <div className="mb-4 rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
                      ⚠️ Товар снят с продажи — ссылка может не работать. Обратитесь к организатору.
                    </div>
                  )}
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {/* Картинка */}
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
                            {isFullyFunded
                              ? "✅ Цель достигнута!"
                              : remaining > 0
                                ? `Осталось собрать ${(remaining / 100).toFixed(0)} ₽ — скиньтесь, чтобы довести до цели`
                                : "Сбор продолжается"}
                            {item.min_contribution_cents && (
                              <span className="ml-2">
                                (мин. вклад: {(item.min_contribution_cents / 100).toFixed(0)} ₽)
                              </span>
                            )}
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
                            {item.reservations.flatMap((r) =>
                              r.contributions.length > 0
                                ? r.contributions.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between rounded-lg bg-white p-2 text-sm">
                                      <span className="font-medium text-amber-900">
                                        {c.is_anonymous ? "Анонимный участник" : c.contributor_name || "Анонимный участник"}
                                      </span>
                                      <span className="font-semibold text-emerald-700">
                                        {(c.amount_cents / 100).toFixed(0)} ₽
                                      </span>
                                    </div>
                                  ))
                                : [
                                    <div key={r.id} className="flex items-center gap-2 rounded-lg bg-white p-2 text-sm">
                                      <span className="font-medium text-amber-900">{r.reserver_name}</span>
                                      <span className="text-stone-500">участвует в сборе</span>
                                    </div>,
                                  ]
                            )}
                          </div>
                        </div>
                      )}

                      {/* Кнопки действий */}
                      <div className="mt-4 flex flex-wrap gap-3">
                        {!item.allow_group_funding && !isReserved && (
                          <button
                            onClick={() => setReserveModalItem(item)}
                            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                          >
                            📌 Зарезервировать подарок
                          </button>
                        )}
                        {item.allow_group_funding && !isFullyFunded && (
                          <button
                            onClick={() => setContributeModalItem(item)}
                            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                          >
                            💰 Скинуться на подарок
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {/* Модалка резервирования */}
          {reserveModalItem && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
              <div className="card-glow max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-h-none sm:max-w-md sm:rounded-3xl">
                <h3 className="mb-4 text-xl font-bold text-amber-900">
                  Зарезервировать подарок
                </h3>
                <p className="mb-4 text-stone-600">{reserveModalItem.title}</p>
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-stone-700">
                      Ваше имя <span className="text-red-500">*</span>
                    </span>
                    <input
                      type="text"
                      className="w-full rounded-xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 text-base transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                      placeholder="Как вас зовут?"
                      value={reserveName}
                      onChange={(e) => setReserveName(e.target.value)}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-stone-700">
                      Комментарий <span className="text-stone-400">(необязательно)</span>
                    </span>
                    <textarea
                      className="w-full rounded-xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 text-base transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                      placeholder="Например: 'Сюрприз!'"
                      rows={3}
                      value={reserveMessage}
                      onChange={(e) => setReserveMessage(e.target.value)}
                    />
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setReserveModalItem(null);
                        setReserveName("");
                        setReserveMessage("");
                      }}
                      className="flex-1 rounded-xl border-2 border-amber-300 bg-white px-4 py-3 font-semibold text-amber-800 transition-colors hover:bg-amber-50"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleReserve}
                      disabled={submitting || !reserveName.trim()}
                      className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:scale-100 disabled:opacity-60"
                    >
                      {submitting ? "Резервируем..." : "Зарезервировать"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Модалка вклада */}
          {contributeModalItem && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
              <div className="card-glow max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-h-none sm:max-w-md sm:rounded-3xl">
                <h3 className="mb-4 text-xl font-bold text-amber-900">Скинуться на подарок</h3>
                <p className="mb-4 text-stone-600">{contributeModalItem.title}</p>
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-stone-700">
                      Ваше имя <span className="text-red-500">*</span>
                    </span>
                    <input
                      type="text"
                      className="w-full rounded-xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 text-base transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                      placeholder="Как вас зовут?"
                      value={contributeName}
                      onChange={(e) => setContributeName(e.target.value)}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-stone-700">
                      Сумма вклада, ₽ <span className="text-red-500">*</span>
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      className="w-full rounded-xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 text-base transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                      placeholder={`Мин: ${contributeModalItem.min_contribution_cents ? (contributeModalItem.min_contribution_cents / 100).toFixed(0) : "100"} ₽`}
                      value={contributeAmount}
                      onChange={(e) => setContributeAmount(e.target.value)}
                      required
                    />
                    <p className="mt-1 text-xs text-stone-500">
                      Осталось собрать:{" "}
                      {(
                        ((contributeModalItem.target_amount_cents || contributeModalItem.price_cents || 0) -
                          contributeModalItem.collected_amount_cents) /
                        100
                      ).toFixed(0)}{" "}
                      ₽
                    </p>
                  </label>
                  <label className="flex items-start gap-3 rounded-xl border-2 border-amber-200 bg-amber-50/30 p-4">
                    <input
                      type="checkbox"
                      checked={contributeAnonymous}
                      onChange={(e) => setContributeAnonymous(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-amber-300 text-amber-600 focus:ring-amber-400"
                    />
                    <div>
                      <span className="block font-semibold text-stone-700">Показать как аноним</span>
                      <span className="mt-1 block text-xs text-stone-600">
                        Ваше имя не будет видно другим участникам сбора
                      </span>
                    </div>
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setContributeModalItem(null);
                        setContributeName("");
                        setContributeAmount("");
                        setContributeAnonymous(false);
                      }}
                      className="flex-1 rounded-xl border-2 border-amber-300 bg-white px-4 py-3 font-semibold text-amber-800 transition-colors hover:bg-amber-50"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleContribute}
                      disabled={submitting || !contributeName.trim() || !contributeAmount}
                      className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:scale-100 disabled:opacity-60"
                    >
                      {submitting ? "Вносим вклад..." : "Скинуться"}
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
