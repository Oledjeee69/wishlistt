"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getApiUrl } from "@/lib/api";

export default function NewWishlistPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = window.localStorage.getItem("token");
      if (!token) {
        throw new Error("Необходимо войти");
      }
      const res = await fetch(getApiUrl("/wishlists"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description: description || null,
          event_date: eventDate || null,
          is_public: isPublic,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Не удалось создать вишлист");
      }
      const data = await res.json();
      router.push(`/wishlist/${data.id}`);
    } catch (err: any) {
      setError(err.message || "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl">
      <div className="card-glow rounded-3xl bg-white/95 p-8 shadow-xl backdrop-blur-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-2xl shadow-lg">
            📋
          </div>
          <h1 className="text-3xl font-bold text-amber-900">Новый вишлист</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-700">
              Название списка <span className="text-red-500">*</span>
            </span>
            <input
              className="w-full rounded-xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 text-base transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              placeholder="Например: Мой день рождения"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-700">
              Описание <span className="text-stone-400">(необязательно)</span>
            </span>
            <textarea
              className="w-full rounded-xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 text-base transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              placeholder="Расскажите о событии или просто оставьте пустым"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-700">
              Дата события <span className="text-stone-400">(необязательно)</span>
            </span>
            <input
              type="date"
              className="w-full rounded-xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 text-base transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </label>

          <label className="flex items-start gap-3 rounded-xl border-2 border-amber-200 bg-amber-50/30 p-4">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-amber-300 text-amber-600 focus:ring-amber-400"
            />
            <div>
              <span className="block font-semibold text-stone-700">Публичный список</span>
              <span className="mt-1 block text-sm text-stone-600">
                Список будет доступен по ссылке без регистрации — друзья смогут открыть его и зарезервировать подарки
              </span>
            </div>
          </label>

          {error && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl disabled:scale-100 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Создаём...
                </span>
              ) : (
                "Создать вишлист"
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

