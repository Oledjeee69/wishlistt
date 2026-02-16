"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiUrl, NETWORK_ERROR_HINT } from "@/lib/api";

export default function LoginPage() {
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
      const form = new URLSearchParams();
      form.set("username", email);
      form.set("password", password);

      const res = await fetch(getApiUrl("/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Не удалось войти");
      }

      const data = (await res.json()) as { access_token: string };
      window.localStorage.setItem("token", data.access_token);
      router.push("/dashboard");
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
    <main className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card-glow rounded-3xl bg-white/95 p-8 shadow-xl backdrop-blur-sm">
          {/* Иконка */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-3xl shadow-lg">
              🔐
            </div>
          </div>

          <h1 className="mb-2 text-center text-3xl font-bold text-amber-900">
            Вход
          </h1>
          <p className="mb-8 text-center text-stone-600">
            Войдите, чтобы управлять своими списками желаний
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-stone-700">
                Email
              </span>
              <input
                type="email"
                className="w-full rounded-xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 text-base transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-stone-700">
                Пароль
              </span>
              <input
                type="password"
                className="w-full rounded-xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3 text-base transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl disabled:scale-100 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Входим...
                </span>
              ) : (
                "Войти"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

