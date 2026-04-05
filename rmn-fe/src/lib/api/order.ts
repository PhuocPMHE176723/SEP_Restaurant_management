import { apiBaseUrl } from "../config";
import { authHeaders, handleResponse } from "./api-helper";

export interface OrderResponse {
  orderId: number;
  orderCode: string;
  status: string;
  tableId?: number;
  tableName?: string;
  orderType: string;
  customerName?: string;
  openedAt: string;
  closedAt?: string;
  totalAmount: number;
  note?: string;
  orderItems: OrderItemResponse[];
}

export interface OrderItemResponse {
  orderItemId: number;
  itemNameSnapshot: string;
  quantity: number;
  unitPrice: number;
  status?: string;
  note?: string;
}

export interface UpdateOrderStatusRequest {
  status: string;
}

export interface AddOrderItemRequest {
  menuItemId: number;
  quantity: number;
  note?: string;
}

export const orderApi = {
  async getAllOrders(startDate?: string, endDate?: string): Promise<OrderResponse[]> {
    let url = `${apiBaseUrl}/api/Order`;
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, {
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
    tableIds: number[];
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

  async updateOrderItemStatus(
    orderItemId: number,
    status: string
  ): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/api/Order/items/${orderItemId}/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });

    await handleResponse<void>(response);
  },

  async confirmItems(orderId: number, orderItemIds: number[]): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/api/Order/${orderId}/confirm-items`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ orderItemIds }),
    });

    await handleResponse<void>(response);
  },
  async mergeOrders(request: { primaryOrderId: number; secondaryOrderIds: number[] }): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/api/Order/merge`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(request),
    });

    await handleResponse<void>(response);
  },
};