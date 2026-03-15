import { apiBaseUrl } from "../config";
import { getToken } from "../auth";

export interface OrderResponse {
  orderId: number;
  orderCode: string;
  status: string;
  tableName?: string;
  customerName?: string;
  openedAt: string;
  closedAt?: string;
  totalAmount: number;
  orderItems: OrderItemResponse[];
}

export interface OrderItemResponse {
  orderItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  note?: string;
}

export interface UpdateOrderStatusRequest {
  status: string;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface AddOrderItemRequest {
  menuItemId: number;
  quantity: number;
  note?: string;
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

export const orderApi = {
  async getAllOrders(): Promise<OrderResponse[]> {
    const response = await fetch(`${apiBaseUrl}/api/Order`, {
      headers: authHeaders(),
    });

    return handleResponse<OrderResponse[]>(response);
  },

  async getOrder(id: number): Promise<OrderResponse> {
    const response = await fetch(`${apiBaseUrl}/api/Order/${id}`, {
      headers: authHeaders(),
    });

    return handleResponse<OrderResponse>(response);
  },

  async updateOrderStatus(
    id: number,
    request: UpdateOrderStatusRequest,
  ): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/api/Order/${id}/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(request),
    });

    await handleResponse<void>(response);
  },

  async addOrderItem(id: number, request: AddOrderItemRequest): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/api/Order/${id}/items`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(request),
    });

    await handleResponse<void>(response);
  },

  async createWalkinOrder(request: {
    tableId: number;
    name: string;
    phone: string;
    partySize: number;
    note?: string;
  }): Promise<{ orderId: number; orderCode: string }> {
    const response = await fetch(`${apiBaseUrl}/api/Order/walkin`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(request),
    });

    return handleResponse<{ orderId: number; orderCode: string }>(response);
  },

  async transferTable(request: {
    fromTableId: number;
    toTableId: number;
    reason: string;
  }): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/api/Order/transfer`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(request),
    });

    await handleResponse<void>(response);
  },
};