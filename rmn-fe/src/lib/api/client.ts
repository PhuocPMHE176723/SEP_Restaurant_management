import { apiBaseUrl } from "../config";
import type { MenuItem, Category, Booking, RmnItem } from "../../types/models";

const defaultHeaders = { "Content-Type": "application/json" };

// ─── Helpers ───────────────────────────────────────────────────
function normalizeKey(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

function pickCategoryIcon(name: string): string {
  const key = normalizeKey(name);

  if (key.includes("khai vi")) return "🥗"; // appetizers
  if (key.includes("chinh")) return "🍛"; // mains
  if (key.includes("lau") || key.includes("nuong")) return "🍲"; // hotpot/grill
  if (key.includes("trang mieng") || key.includes("dessert")) return "🍰";
  if (
    key.includes("do uong") ||
    key.includes("thuc uong") ||
    key.includes("nuoc") ||
    key.includes("drink") ||
    key.includes("beverage")
  ) return "🍹"; // drinks
  if (key.includes("hai san") || key.includes("seafood")) return "🦐";
  if (key.includes("chay") || key.includes("vegan") || key.includes("vegetarian")) return "🥦";
  if (key.includes("salad")) return "🥗";
  if (key.includes("pizza")) return "🍕";
  if (key.includes("burger")) return "🍔";
  return "🍹"; // default
}

function normalizeCategory(c: any): Category {
  const rawId = c?.id ?? c?.categoryId ?? c?.code ?? c?.slug ?? c?.categoryID;
  const name = (c?.name ?? c?.categoryName ?? "").trim();
  const forcedIcon = pickCategoryIcon(name);
  const iconCandidate = c?.icon ?? c?.emoji;
  const isGeneric = iconCandidate
    ? /^(🍹|🍜|🍲|🍛|🥘)/.test(iconCandidate)
    : true;
  const icon =
    forcedIcon !== "🍽️" && (isGeneric || !iconCandidate)
      ? forcedIcon
      : iconCandidate || forcedIcon || "🍽️";
  return {
    id: String(rawId ?? name ?? ""),
    categoryId: c?.categoryId ?? c?.id,
    name,
    categoryName: c?.categoryName ?? name,
    icon,
    itemCount: c?.itemCount ?? c?.count,
    description: c?.description,
    displayOrder: c?.displayOrder,
    isActive: c?.isActive ?? c?.IsActive ?? false,
  };
}

function normalizeMenuItem(m: any): MenuItem {
  const rawId = m?.id ?? m?.itemId ?? m?.code ?? m?.slug;
  const name = m?.name ?? m?.itemName ?? "Món ăn";
  const price = m?.price ?? m?.basePrice ?? 0;
  return {
    id: String(rawId ?? name),
    itemId: m?.itemId ?? m?.id,
    name,
    itemName: m?.itemName ?? name,
    description: m?.description ?? "",
    basePrice: m?.basePrice ?? price,
    price,
    categoryId: (m?.categoryId ?? m?.categoryID ?? "").toString(),
    categoryName: m?.categoryName ?? m?.category?.categoryName ?? "",
    image: m?.image ?? m?.imageUrl ?? m?.thumbnail,
    thumbnail: m?.thumbnail ?? m?.image ?? m?.imageUrl,
    isAvailable: m?.isAvailable ?? m?.isActive ?? true,
    isActive: m?.isActive,
    isFeatured: m?.isFeatured ?? false,
    prepTimeMinutes: m?.prepTimeMinutes,
    rating: m?.rating,
    reviewCount: m?.reviewCount,
    createdAt: m?.createdAt,
  };
}

// ─── Health ──────────────────────────────────────────────────
export async function getHealth(): Promise<string> {
  const res = await fetch(`${apiBaseUrl}/api/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Health check failed (${res.status})`);
  const body = (await res.json()) as { status?: string };
  return body.status ?? "unknown";
}

export async function getRmnItems(): Promise<RmnItem[]> {
  const res = await fetch(`${apiBaseUrl}/api/rmn`, { cache: "no-store", headers: defaultHeaders });
  if (!res.ok) throw new Error(`Failed to load items (${res.status})`);
  return (await res.json()) as RmnItem[];
}

// ─── Time slots ───────────────────────────────────────────────
export const TIME_SLOTS = [
  "11:00", "11:30", "12:00", "12:30", "13:00",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
];

// ─── API functions (no mock fallback) ────────────────────────
export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${apiBaseUrl}/api/MenuCategory`, {
    cache: "no-store",
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error(`Tải danh mục thất bại (${res.status})`);
  const body = await res.json();
  const list = Array.isArray(body) ? body : body.data ?? body.Data ?? [];
  const normalized = list.map(normalizeCategory);

  // keep only active categories and dedupe by normalized name
  const seen = new Set<string>();
  const activeUnique: Category[] = [];
  for (const cat of normalized) {
    if (cat.isActive !== true) continue;
    const key = normalizeKey(cat.name);
    if (seen.has(key)) continue;
    seen.add(key);
    activeUnique.push(cat);
  }
  return activeUnique;
}

export async function getMenuItems(categoryId?: string | number): Promise<MenuItem[]> {
  const cid = categoryId === undefined || categoryId === null || categoryId === "all"
    ? undefined
    : categoryId;
  const query = cid ? `?categoryId=${encodeURIComponent(cid)}` : "";
  const res = await fetch(`${apiBaseUrl}/api/MenuItem${query}`, {
    cache: "no-store",
    headers: defaultHeaders,
  });
  if (!res.ok) throw new Error(`Tải thực đơn thất bại (${res.status})`);
  const body = await res.json();
  const list = Array.isArray(body) ? body : body.data ?? body.Data ?? [];
  return list
    .map(normalizeMenuItem)
    .filter((i: MenuItem) => i.isActive !== false && i.isAvailable !== false);
}

export async function getFeaturedItems(): Promise<MenuItem[]> {
  const all = await getMenuItems();
  const featured = all.filter((i) => i.isFeatured && i.isActive !== false && i.isAvailable !== false);
  if (featured.length > 0) return featured;

  // Fallback: surface active items when no item is flagged featured
  const active = all.filter((i) => i.isActive !== false && i.isAvailable !== false);
  return active.slice(0, 8);
}

export async function createBooking(data: Omit<Booking, "id" | "status" | "confirmedAt">): Promise<Booking> {
  const res = await fetch(`${apiBaseUrl}/api/bookings`, {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Đặt bàn thất bại (${res.status})`);
  const body = await res.json();
  return (Array.isArray(body) ? body[0] : body.data ?? body) as Booking;
}

export function formatVND(price: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}
