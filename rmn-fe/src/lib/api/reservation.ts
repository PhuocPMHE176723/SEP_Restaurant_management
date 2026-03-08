// ── Customer Reservation API ───────────────────────────────────
import { apiBaseUrl } from "../config";
import { getToken } from "../auth";

// ── Types ────────────────────────────────────────────────────
export interface MenuItem {
    itemId: number;
    categoryId: number;
    categoryName: string;
    itemName: string;
    unit?: string | null;
    description?: string | null;
    basePrice: number;
    thumbnail?: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface OrderItemRequest {
    itemId: number;
    quantity: number;
    note?: string;
}

export interface OrderItemDTO {
    orderItemId: number;
    itemId: number;
    itemNameSnapshot: string;
    quantity: number;
    unitPrice: number;
    note?: string | null;
}

export interface OrderDTO {
    orderId: number;
    orderCode: string;
    status: string;
    subtotal: number;
    orderItems: OrderItemDTO[];
}

export interface CreateReservationRequest {
    reservedAt: string; // ISO format
    partySize: number;
    durationMinutes?: number;
    note?: string;
    menuItems: OrderItemRequest[];
}

export interface ReservationDTO {
    reservationId: number;
    customerId?: number | null;
    tableId?: number | null;
    customerName: string;
    customerPhone: string;
    partySize: number;
    reservedAt: string;
    durationMinutes: number;
    status: string;
    note?: string | null;
    createdAt: string;
    createdByStaffId?: number | null;
    order?: OrderDTO | null;
}

// ── Helpers ───────────────────────────────────────────────────
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

// ── Menu Items API (Public) ───────────────────────────────────
export async function getPublicMenuItems(): Promise<MenuItem[]> {
    const res = await fetch(`${apiBaseUrl}/api/menuitem`, {
        headers: { "Content-Type": "application/json" },
        cache: "no-store"
    });
    return handleResponse<MenuItem[]>(res);
}

// ── Reservation API (Customer Only) ────────────────────────────
export async function createReservation(request: CreateReservationRequest): Promise<ReservationDTO> {
    const res = await fetch(`${apiBaseUrl}/api/reservation`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(request),
    });
    return handleResponse<ReservationDTO>(res);
}

export async function getMyReservations(): Promise<ReservationDTO[]> {
    const res = await fetch(`${apiBaseUrl}/api/reservation/my-reservations`, {
        headers: authHeaders(),
        cache: "no-store",
    });
    return handleResponse<ReservationDTO[]>(res);
}

export async function getReservationById(id: number): Promise<ReservationDTO> {
    const res = await fetch(`${apiBaseUrl}/api/reservation/${id}`, {
        headers: authHeaders(),
        cache: "no-store",
    });
    return handleResponse<ReservationDTO>(res);
}

export async function cancelReservation(id: number): Promise<void> {
    const res = await fetch(`${apiBaseUrl}/api/reservation/${id}/cancel`, {
        method: "POST",
        headers: authHeaders(),
    });
    await handleResponse<void>(res);
}
