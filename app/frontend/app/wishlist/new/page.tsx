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
    <main className="mx-auto flex max-w-xl flex-col gap-6 py-8">
      <h1 className="text-2xl font-semibold">Новый вишлист</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
        <label className="flex flex-col gap-1">
          <span>Название списка</span>
          <input
            className="rounded-md border border-slate-300 px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Описание (необязательно)</span>
          <textarea
            className="min-h-[80px] rounded-md border border-slate-300 px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Дата события (необязательно)</span>
          <input
            type="date"
            className="rounded-md border border-slate-300 px-3 py-2"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <span>Список виден по ссылке без регистрации</span>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Создаём..." : "Создать"}
        </button>
      </form>
    </main>
  );
}

