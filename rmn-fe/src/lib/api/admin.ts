// ── Admin API Types & Calls ────────────────────────────────────────
import { apiBaseUrl } from "../config";
import { getToken } from "../auth";

// ── Types ────────────────────────────────────────────────────────
export interface DiningTable {
    tableId: number;
    tableCode: string;
    tableName?: string | null;
    capacity: number;
    status: string;
    isActive: boolean;
}

export interface CreateDiningTableRequest {
    tableCode: string;
    tableName?: string;
    capacity: number;
    status: string;
}

export interface UpdateDiningTableRequest {
    tableCode?: string;
    tableName?: string;
    capacity?: number;
    status?: string;
    isActive?: boolean;
}

export interface MenuCategory {
    categoryId: number;
    categoryName: string;
    description?: string | null;
    displayOrder: number;
    isActive: boolean;
}

export interface CreateMenuCategoryRequest {
    categoryName: string;
    description?: string;
    displayOrder: number;
}

export interface UpdateMenuCategoryRequest {
    categoryName?: string;
    description?: string;
    displayOrder?: number;
    isActive?: boolean;
}

export interface MenuItem {
    itemId: number;
    categoryId: number;
    categoryName: string;
    itemName: string;
    description?: string | null;
    basePrice: number;
    thumbnail?: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface CreateMenuItemRequest {
    categoryId: number;
    itemName: string;
    description?: string;
    basePrice: number;
    thumbnail?: string;
}

export interface UpdateMenuItemRequest {
    categoryId?: number;
    itemName?: string;
    description?: string;
    basePrice?: number;
    thumbnail?: string;
    isActive?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────
function authHeaders(): Record<string, string> {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function handleResponse<T>(res: Response): Promise<T> {
    const json = (await res.json()) as { data?: T; message?: string; errors?: string[] };
    if (!res.ok) throw new Error(json.message ?? `Request failed (${res.status})`);
    return json.data as T;
}

// ── DiningTable API ───────────────────────────────────────────────
export async function getTables(): Promise<DiningTable[]> {
    const res = await fetch(`${apiBaseUrl}/api/diningtable`, { headers: authHeaders(), cache: "no-store" });
    return handleResponse<DiningTable[]>(res);
}

export async function createTable(body: CreateDiningTableRequest): Promise<DiningTable> {
    const res = await fetch(`${apiBaseUrl}/api/diningtable`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(body),
    });
    return handleResponse<DiningTable>(res);
}

export async function updateTable(id: number, body: UpdateDiningTableRequest): Promise<void> {
    const res = await fetch(`${apiBaseUrl}/api/diningtable/${id}`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify(body),
    });
    await handleResponse<unknown>(res);
}

export async function deleteTable(id: number): Promise<void> {
    const res = await fetch(`${apiBaseUrl}/api/diningtable/${id}`, {
        method: "DELETE", headers: authHeaders(),
    });
    await handleResponse<unknown>(res);
}

// ── MenuCategory API ──────────────────────────────────────────────
export async function getMenuCategories(): Promise<MenuCategory[]> {
    const res = await fetch(`${apiBaseUrl}/api/menucategory`, { headers: authHeaders(), cache: "no-store" });
    return handleResponse<MenuCategory[]>(res);
}

export async function createMenuCategory(body: CreateMenuCategoryRequest): Promise<MenuCategory> {
    const res = await fetch(`${apiBaseUrl}/api/menucategory`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(body),
    });
    return handleResponse<MenuCategory>(res);
}

export async function updateMenuCategory(id: number, body: UpdateMenuCategoryRequest): Promise<void> {
    const res = await fetch(`${apiBaseUrl}/api/menucategory/${id}`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify(body),
    });
    await handleResponse<unknown>(res);
}

export async function deleteMenuCategory(id: number): Promise<void> {
    const res = await fetch(`${apiBaseUrl}/api/menucategory/${id}`, {
        method: "DELETE", headers: authHeaders(),
    });
    await handleResponse<unknown>(res);
}

// ── MenuItem API ──────────────────────────────────────────────────
export async function getMenuItems(categoryId?: number): Promise<MenuItem[]> {
    const url = categoryId 
        ? `${apiBaseUrl}/api/menuitem?categoryId=${categoryId}`
        : `${apiBaseUrl}/api/menuitem`;
    const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
    return handleResponse<MenuItem[]>(res);
}

export async function createMenuItem(body: CreateMenuItemRequest): Promise<MenuItem> {
    const res = await fetch(`${apiBaseUrl}/api/menuitem`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(body),
    });
    return handleResponse<MenuItem>(res);
}

export async function updateMenuItem(id: number, body: UpdateMenuItemRequest): Promise<void> {
    const res = await fetch(`${apiBaseUrl}/api/menuitem/${id}`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify(body),
    });
    await handleResponse<unknown>(res);
}

export async function deleteMenuItem(id: number): Promise<void> {
    const res = await fetch(`${apiBaseUrl}/api/menuitem/${id}`, {
        method: "DELETE", headers: authHeaders(),
    });
    await handleResponse<unknown>(res);
}

export async function uploadMenuImage(file: File): Promise<{ url: string }> {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);
    
    const res = await fetch(`${apiBaseUrl}/api/menuitem/upload-image`, {
        method: "POST",
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
    });
    
    return handleResponse<{ url: string }>(res);
}
