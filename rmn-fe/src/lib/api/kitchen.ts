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

export const kitchenApi = {
  async getQueue(): Promise<any[]> {
    const response = await fetch(`${apiBaseUrl}/api/Kitchen/queue`, {
      headers: authHeaders(),
    });
    return handleResponse<any[]>(response);
  },

  async startCooking(orderItemId: number): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/api/Kitchen/item/${orderItemId}/start`, {
      method: "POST",
      headers: authHeaders(),
    });
    await handleResponse<void>(response);
  },

  async serveItem(orderItemId: number): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/api/Kitchen/item/${orderItemId}/serve`, {
      method: "POST",
      headers: authHeaders(),
    });
    await handleResponse<void>(response);
  },
};


export type CookingListItem = {
  itemId: number;
  itemName: string;
  thumbnail?: string | null;
  unit?: string | null;
  totalPreOrderQuantity: number;
  mustCookQuantity: number;
  cookingQuantity: number;
  readyServeQuantity: number;
  lastUpdatedAt?: string | null;
};

export const cookingApi = {
  async getCookingList(): Promise<CookingListItem[]> {
    const response = await fetch(`${apiBaseUrl}/api/Kitchen/cooking-list`, {
      headers: authHeaders(),
      cache: "no-store",
    });
    return handleResponse<CookingListItem[]>(response);
  },

  async startCookingByItem(itemId: number): Promise<void> {
    const response = await fetch(
      `${apiBaseUrl}/api/Kitchen/cooking-list/${itemId}/start-cooking`,
      {
        method: "POST",
        headers: authHeaders(),
      }
    );
    await handleResponse<void>(response);
  },

  async markReadyByItem(itemId: number): Promise<void> {
    const response = await fetch(
      `${apiBaseUrl}/api/Kitchen/cooking-list/${itemId}/mark-ready`,
      {
        method: "POST",
        headers: authHeaders(),
      }
    );
    await handleResponse<void>(response);
  },
};
