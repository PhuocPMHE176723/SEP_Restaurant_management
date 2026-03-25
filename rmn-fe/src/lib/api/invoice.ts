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

export interface InvoicePreview {
  orderId: number;
  orderCode: string;
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  totalAmount: number;
  depositDeducted: number;
  amountToPay: number;
  pointsEarned: number;
  items: any[];
}

export const invoiceApi = {
  async getPreview(orderId: number, discountCode?: string, pointsToUse: number = 0): Promise<InvoicePreview> {
    const params = new URLSearchParams();
    if (discountCode) params.append("discountCode", discountCode);
    if (pointsToUse) params.append("pointsToUse", pointsToUse.toString());

    const response = await fetch(`${apiBaseUrl}/api/Invoice/preview/${orderId}?${params.toString()}`, {
      headers: authHeaders(),
    });
    return handleResponse<InvoicePreview>(response);
  },

  async checkout(request: {
    orderId: number;
    discountCode?: string;
    pointsToUse: number;
    paidAmount: number;
  }): Promise<{ invoiceId: number; invoiceCode: string }> {
    const response = await fetch(`${apiBaseUrl}/api/Invoice/checkout`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(request),
    });
    return handleResponse<{ invoiceId: number; invoiceCode: string }>(response);
  },
};
