"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiUrl, NETWORK_ERROR_HINT } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl("/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Не удалось зарегистрироваться");
      }

      router.push("/auth/login");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ошибка";
      setError(
        message === "Failed to fetch" || message.includes("fetch")
          ? NETWORK_ERROR_HINT
          : message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md">
      <div className="rounded-2xl bg-white/90 p-6 shadow-lg shadow-amber-900/5">
        <h1 className="text-2xl font-semibold text-amber-900">Регистрация</h1>
        <p className="mt-1 text-sm text-stone-600">
          Создайте аккаунт, чтобы вести свои списки желаний.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-stone-700">Email</span>
            <input
              type="email"
              className="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-stone-700">Пароль</span>
            <input
              type="password"
              className="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {loading ? "Создаём аккаунт..." : "Создать аккаунт"}
          </button>
        </form>
      </div>
    </main>
  );
}

