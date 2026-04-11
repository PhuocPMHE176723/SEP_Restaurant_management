import { apiBaseUrl } from "../config";
import { getToken } from "../auth";

export interface CustomerSummaryDTO {
  customerId: number;
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  totalPoints?: number;
}

export interface OrderItemDTO {
  orderItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  note?: string | null;
}

export interface OrderDTO {
  orderId: number;
  orderCode: string;
  status: string;
  tableName?: string | null;
  customerName?: string | null;
  openedAt: string;
  closedAt?: string | null;
  totalAmount: number;
  orderItems: OrderItemDTO[];
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

export interface CustomerContextDTO {
  displayMode: "SERVING" | "PREORDER" | "NONE";
  customer?: CustomerSummaryDTO | null;
  activeOrder?: OrderDTO | null;
  activeReservation?: ReservationDTO | null;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message ?? `Request failed (${res.status})`);
  }
  return json.data as T;
}

export const customerApi = {
  async getMyContext(): Promise<CustomerContextDTO> {
    const res = await fetch(`${apiBaseUrl}/api/User/me/context`, {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    });

    return handleResponse<CustomerContextDTO>(res);
  },
};