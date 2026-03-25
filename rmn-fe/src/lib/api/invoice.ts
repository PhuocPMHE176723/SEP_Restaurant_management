import { apiBaseUrl } from "../config";
import { getToken } from "../auth";

export interface InvoicePreview {
  orderId: number;
  orderCode: string;
  customerName?: string;
  customerId?: number;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  items: {
    menuItemName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

export interface CheckoutRequest {
  orderId: number;
  customerId?: number;
  discountCode?: string;
  paymentMethod: string;
  note?: string;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const invoiceApi = {
  async previewInvoice(orderId: number): Promise<InvoicePreview> {
    const response = await fetch(`${apiBaseUrl}/api/Invoice/preview/${orderId}`, {
      headers: authHeaders(),
    });

    const json = await response.json();
    if (!json.success && !json.Success) {
      throw new Error(json.message || "Lỗi khi tải thông tin hóa đơn");
    }
    return json.data || json.Data;
  },

  async checkout(request: CheckoutRequest): Promise<{ invoiceId: number; invoiceCode: string }> {
    const response = await fetch(`${apiBaseUrl}/api/Invoice/checkout`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(request),
    });

    const json = await response.json();
    if (!json.success && !json.Success) {
      throw new Error(json.message || "Thanh toán thất bại");
    }
    return json.data || json.Data;
  }
};
