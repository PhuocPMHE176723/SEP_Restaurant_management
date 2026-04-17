import { apiBaseUrl } from "../config";
import { getToken } from "../auth";

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = (await res.json()) as {
    data?: T;
    message?: string;
    success?: boolean;
    Success?: boolean;
    Data?: T;
  };

  const success = json.success ?? json.Success ?? res.ok;

  if (!success) {
    throw new Error(json.message ?? `Request failed (${res.status})`);
  }

  return (json.data ?? json.Data) as T;
}

export type ServingItem = {
  itemId: number;
  itemName: string;
  thumbnail?: string | null;
  unit?: string | null;
  readyQuantity: number;
  waitingTableCount: number;
  lastUpdatedAt?: string | null;
};

export type ServingTable = {
  orderId: number;
  orderCode: string;
  tableNames: string;
  displayLabel: string;
  orderedQuantity: number;
  readyQuantity: number;
  servedQuantity: number;
  priority: boolean;
  openedAt: string;
};

export const servingApi = {
  async getServingList(): Promise<ServingItem[]> {
    const response = await fetch(`${apiBaseUrl}/api/Serving/serving-list`, {
      headers: authHeaders(),
      cache: "no-store",
    });
    return handleResponse<ServingItem[]>(response);
  },

  async getServingTables(itemId: number): Promise<ServingTable[]> {
    const response = await fetch(`${apiBaseUrl}/api/Serving/serving-list/${itemId}/tables`, {
      headers: authHeaders(),
      cache: "no-store",
    });
    return handleResponse<ServingTable[]>(response);
  },

  async serveReadyItem(itemId: number, orderId: number, quantity = 1): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/api/Serving/serving-list/${itemId}/serve`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ orderId, quantity }),
    });
    await handleResponse<void>(response);
  },

  async reassignReadyItem(
    itemId: number,
    fromOrderId: number,
    toOrderId: number,
    quantity = 1
  ): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/api/Serving/serving-list/${itemId}/reassign`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ fromOrderId, toOrderId, quantity }),
    });
    await handleResponse<void>(response);
  },
};