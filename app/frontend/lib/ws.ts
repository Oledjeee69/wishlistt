const getWsBase = () => {
  if (typeof window === "undefined") return "ws://localhost:8000/ws/wishlists";
  const api = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (wsUrl) return wsUrl.replace(/\/$/, "");
  return api.replace(/^http/, "ws") + "/ws/wishlists";
};

export function createWishlistSocket(wishlistId: number) {
  const base = getWsBase();
  const url = `${base}/${wishlistId}`;
  return new WebSocket(url);
}

