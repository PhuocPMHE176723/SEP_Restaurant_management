import { apiBaseUrl } from "../config";
import type { MenuItem, Category, Booking, RmnItem } from "../../types/generated";

const defaultHeaders = { "Content-Type": "application/json" };

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

// ─── Mock Data ────────────────────────────────────────────────
export const MOCK_CATEGORIES: Category[] = [
  { id: "all", name: "Tất cả", icon: "🍽️", itemCount: 20 },
  { id: "khai-vi", name: "Khai vị", icon: "🥗", itemCount: 5 },
  { id: "mon-chinh", name: "Món chính", icon: "🥩", itemCount: 7 },
  { id: "hai-san", name: "Hải sản", icon: "🦞", itemCount: 5 },
  { id: "lau", name: "Lẩu & Nướng", icon: "🫕", itemCount: 4 },
  { id: "trang-mieng", name: "Tráng miệng", icon: "🍮", itemCount: 4 },
  { id: "do-uong", name: "Đồ uống", icon: "🍷", itemCount: 5 },
];

export const MOCK_MENU_ITEMS: MenuItem[] = [
  // Khai vị
  {
    id: "goi-cuon-1",
    name: "Gỏi cuốn tôm thịt",
    description: "Gỏi cuốn tươi với tôm, thịt luộc, bún, rau sống và nước chấm đặc biệt",
    price: 85000,
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80",
    categoryId: "khai-vi", categoryName: "Khai vị",
    isAvailable: true, isFeatured: false, rating: 4.6, reviewCount: 128,
  },
  {
    id: "goi-ngo-sen-1",
    name: "Gỏi ngó sen tôm thịt",
    description: "Ngó sen giòn, tôm luộc, thịt bò tái, rau thơm, đậu phộng rang, mắm chua ngọt",
    price: 110000,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
    categoryId: "khai-vi", categoryName: "Khai vị",
    isAvailable: true, isFeatured: true, rating: 4.8, reviewCount: 214,
  },
  {
    id: "sup-mang-1",
    name: "Súp măng cua",
    description: "Súp thịt cua thanh ngọt, măng tươi, trứng cút, tiêu xay – khai vị hoàn hảo",
    price: 75000,
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80",
    categoryId: "khai-vi", categoryName: "Khai vị",
    isAvailable: true, rating: 4.5, reviewCount: 98,
  },
  // Món chính
  {
    id: "bo-luc-lac-1",
    name: "Bò lúc lắc rau củ nướng",
    description: "Thịt bò mềm xào lúc lắc kiểu Pháp cùng ớt chuông, hành tây, salad xanh và khoai tây chiên",
    price: 195000,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80",
    categoryId: "mon-chinh", categoryName: "Món chính",
    isAvailable: true, isFeatured: true, rating: 4.9, reviewCount: 384,
  },
  {
    id: "com-ga-hap-1",
    name: "Cơm gà hấp gừng hành",
    description: "Gà ta hấp mềm, da giòn, ăn cùng cơm gạo dẻo nấu nước dùng gà, gừng hành phi",
    price: 165000,
    image: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80",
    categoryId: "mon-chinh", categoryName: "Món chính",
    isAvailable: true, isFeatured: true, rating: 4.8, reviewCount: 267,
  },
  {
    id: "suon-nuong-1",
    name: "Sườn heo nướng mật ong",
    description: "Sườn non ướp 12 tiếng, nướng mật ong bóng đẹp, ăn kèm rau sống và cơm trắng",
    price: 175000,
    image: "https://images.unsplash.com/photo-1544025162-d76594e69f18?w=600&q=80",
    categoryId: "mon-chinh", categoryName: "Món chính",
    isAvailable: true, rating: 4.7, reviewCount: 201,
  },
  {
    id: "ca-chep-1",
    name: "Cá chép sốt cà chua",
    description: "Cá chép tươi phi lê, áp chảo vàng, sốt cà chua thơm ngon, rau thì là",
    price: 210000,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
    categoryId: "mon-chinh", categoryName: "Món chính",
    isAvailable: true, rating: 4.6, reviewCount: 156,
  },
  // Hải sản
  {
    id: "tom-hum-1",
    name: "Tôm hùm nướng bơ tỏi",
    description: "Tôm hùm Boston 600g nướng bơ tỏi thơm lừng, ăn cùng bánh mì và sốt tartare",
    price: 980000,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    categoryId: "hai-san", categoryName: "Hải sản",
    isAvailable: true, isFeatured: true, rating: 4.9, reviewCount: 512,
  },
  {
    id: "cua-rang-me-1",
    name: "Cua rang me",
    description: "Cua biển tươi sống rang me chua ngọt, ớt tươi và sả – đặc sản nhà hàng",
    price: 650000,
    image: "https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=600&q=80",
    categoryId: "hai-san", categoryName: "Hải sản",
    isAvailable: true, isFeatured: true, rating: 4.8, reviewCount: 334,
  },
  {
    id: "muc-nuong-1",
    name: "Mực nướng sa tế",
    description: "Mực ống tươi nướng sa tế cay nồng, chấm muối ớt chanh – hương vị đại dương",
    price: 245000,
    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80",
    categoryId: "hai-san", categoryName: "Hải sản",
    isAvailable: true, rating: 4.7, reviewCount: 178,
  },
  // Lẩu & Nướng
  {
    id: "lau-thai-1",
    name: "Lẩu Thái hải sản",
    description: "Lẩu Thái cay chua hấp dẫn, tôm, mực, cá, nấm, rau xanh tươi – phục vụ 2–4 người",
    price: 420000,
    image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80",
    categoryId: "lau", categoryName: "Lẩu & Nướng",
    isAvailable: true, isFeatured: true, rating: 4.8, reviewCount: 289,
  },
  {
    id: "nuong-bbq-1",
    name: "BBQ thập cẩm 2 người",
    description: "Set nướng gồm: bò wagyu, tôm, mực, sườn heo, rau củ, nước chấm 3 loại",
    price: 560000,
    image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=80",
    categoryId: "lau", categoryName: "Lẩu & Nướng",
    isAvailable: true, rating: 4.9, reviewCount: 421,
  },
  // Tráng miệng
  {
    id: "banh-flan-1",
    name: "Bánh flan caramel espresso",
    description: "Bánh flan mềm mịn, caramel đắng nhẹ, thêm espresso đậm đà – hương vị khó cưỡng",
    price: 65000,
    image: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=600&q=80",
    categoryId: "trang-mieng", categoryName: "Tráng miệng",
    isAvailable: true, rating: 4.8, reviewCount: 156,
  },
  {
    id: "che-thai-1",
    name: "Chè thái hoa quả",
    description: "Thập cẩm trái cây nhiệt đới, thạch, đậu, nước cốt dừa, đá bào – giải nhiệt tuyệt vời",
    price: 75000,
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=80",
    categoryId: "trang-mieng", categoryName: "Tráng miệng",
    isAvailable: true, rating: 4.7, reviewCount: 198,
  },
  // Đồ uống
  {
    id: "ruou-vang-1",
    name: "Rượu vang đỏ Pháp",
    description: "Chai rượu vang đỏ Bordeaux 2019, tannin mềm, hậu vị dài – lựa chọn hoàn hảo cho bữa tối",
    price: 850000,
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80",
    categoryId: "do-uong", categoryName: "Đồ uống",
    isAvailable: true, isFeatured: true, rating: 4.9, reviewCount: 234,
  },
  {
    id: "mocktail-1",
    name: "Mocktail nhiệt đới",
    description: "Xoài, chanh dây, dứa, nước có gas – tươi mát, không cồn, phù hợp mọi lứa tuổi",
    price: 75000,
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80",
    categoryId: "do-uong", categoryName: "Đồ uống",
    isAvailable: true, rating: 4.7, reviewCount: 167,
  },
];

// ─── Time slots ───────────────────────────────────────────────
export const TIME_SLOTS = [
  "11:00", "11:30", "12:00", "12:30", "13:00",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
];

// ─── API functions (with mock fallback) ──────────────────────
export async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${apiBaseUrl}/api/categories`, { cache: "no-store", headers: defaultHeaders });
    if (!res.ok) throw new Error("not found");
    return (await res.json()) as Category[];
  } catch { return MOCK_CATEGORIES; }
}

export async function getMenuItems(categoryId?: string): Promise<MenuItem[]> {
  try {
    const url = categoryId && categoryId !== "all"
      ? `${apiBaseUrl}/api/menu?categoryId=${categoryId}`
      : `${apiBaseUrl}/api/menu`;
    const res = await fetch(url, { cache: "no-store", headers: defaultHeaders });
    if (!res.ok) throw new Error("not found");
    return (await res.json()) as MenuItem[];
  } catch {
    if (categoryId && categoryId !== "all") {
      return MOCK_MENU_ITEMS.filter((i) => i.categoryId === categoryId);
    }
    return MOCK_MENU_ITEMS;
  }
}

export async function getFeaturedItems(): Promise<MenuItem[]> {
  const all = await getMenuItems();
  return all.filter((i) => i.isFeatured);
}

export async function createBooking(data: Omit<import("../../types/generated").Booking, "id" | "status" | "confirmedAt">): Promise<import("../../types/generated").Booking> {
  try {
    const res = await fetch(`${apiBaseUrl}/api/bookings`, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("not found");
    return (await res.json()) as import("../../types/generated").Booking;
  } catch {
    // Mock confirmation
    await new Promise((r) => setTimeout(r, 1200));
    return {
      ...data,
      id: `BK${Date.now().toString().slice(-6)}`,
      status: "confirmed",
      confirmedAt: new Date().toISOString(),
    };
  }
}

export function formatVND(price: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}
