/**
 * Базовый URL бэкенда. В проде должен быть задан NEXT_PUBLIC_API_URL в Vercel.
 */
export const API_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "")
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getApiUrl(path: string): string {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Сообщение для пользователя при "Failed to fetch" (сеть / CORS / неверный URL).
 */
export const NETWORK_ERROR_HINT =
  "Не удалось связаться с сервером. Проверьте интернет и что в настройках сайта задан адрес API (NEXT_PUBLIC_API_URL).";
